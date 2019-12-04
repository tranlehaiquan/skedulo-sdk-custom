import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import { Package, Option, Lens } from '@skedulo/sked-commons'

import { createSymlinks } from '../../utils/symlink'
import { validateFor } from '../schema-validation'
import { FunctionProjectService } from './FunctionProjectService'
import { MobilePageProjectService } from './MobilePageProjectService'
import { ProjectService } from './ProjectService'
import { WebPageProjectService } from './WebPageProjectService'
import { SessionData } from '../types'
import { NetworkingService } from '../NetworkingService'
import * as tar from 'tar'
import * as crypto from 'crypto'
import { SchemaProjectService } from './SchemaProjectService'

const PACKAGE_FILE = `sked.pkg.json`

const DEFAULT_LINK_SOURCE_PATH = 'src/shared'
const DEFAULT_LINK_DESTINATION_PATH = 'src/__shared'

enum Script {
  Bootstrap = 'bootstrap',
  Compile = 'compile',
  Dev = 'dev'
}

export interface IPreDeployErrors {
  [key: string]: string[]
}

interface SourceUploaded {
  name: string
  hash: string
  metadata: Package
  created: string
  createdBy: string
  revisionCount: number
}

const REQUIRED_PROJECT_SCRIPTS = [Script.Bootstrap, Script.Compile, Script.Dev]

export class InvalidPackage extends Error { }

export class PackageService {

  private apiRequest = (new NetworkingService(this.session)).getAPIRequest()

  packageMetadata: Package
  webpages: WebPageProjectService[] = []
  mobilepages: MobilePageProjectService[] = []
  lambdas: FunctionProjectService[] = []
  schemas: SchemaProjectService[] = []

  static at(packagePath: string, session: SessionData) {
    return new PackageService(packagePath, session)
  }

  private constructor(private packagePath: string, private session: SessionData) {

    const pkgFile = path.join(this.packagePath, '/', PACKAGE_FILE)

    if (!fs.existsSync(pkgFile)) {
      throw new InvalidPackage(`Package file does not exist for ${this.packagePath}`)
    }

    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'))
      this.packageMetadata = this.evaluate(pkg)
    } catch (e) {
      throw new InvalidPackage(`InvalidPackage: ${e.message}`)
    }
  }

  getPackageMetadata() {
    return this.packageMetadata
  }

  evaluate(data: any) {

    const packageMetadata = validateFor<Package>('Package', data)

    const { webpages, mobilepages, functions, schemas } = packageMetadata.components

    this.webpages = webpages ? webpages.items.map(c => WebPageProjectService.at(this.packagePath, c, this.session)) : []
    this.mobilepages = mobilepages ? mobilepages.items.map(c => MobilePageProjectService.at(this.packagePath, c, this.session)) : []
    this.lambdas = functions ? functions.items.map(c => FunctionProjectService.at(this.packagePath, c, this.session)) : []
    this.schemas = schemas ? schemas.items.map(c => SchemaProjectService.at(this.packagePath, c, this.session)) : []

    const allComponentIdentifiers = _.flatten(_.compact([webpages, mobilepages, functions, schemas]).map(c => c.items))

    // Validate items used in links and relationships
    const allRelationshipComponents = _.flatMap(packageMetadata.relationships, relationship => [relationship.primaryComponent, ...relationship.dependencies])
    const allLinkComponents = _.flatMap(packageMetadata.linkedComponents, link => [link.source, ...link.dependants.map(l => l.item)])

    _.uniq([...allRelationshipComponents, ...allLinkComponents]).forEach(component => {
      if (!allComponentIdentifiers.includes(component)) {
        throw new Error(`${component} is not defined as a component but is used as a link or relationship`)
      }
    })

    return packageMetadata
  }

  getRelatedProjectsForProject(project: ProjectService<any>) {
    const allProjects = [...this.lambdas, ...this.mobilepages, ...this.webpages]

    const relatedProjectMetadata = this.packageMetadata.relationships.find(r => r.primaryComponent === project.pathName)
    return (!!relatedProjectMetadata ? relatedProjectMetadata.dependencies : []).map(projectName => allProjects.find(p => p.pathName === projectName)!)
  }

  packageProjectRequiresLink(project: ProjectService<any>) {
    return !!this.resolveLinkDependenciesForProject(project).length
  }

  createPackageLinksForProject(project: ProjectService<any>) {
    const linksWithRelativePath = this.resolveLinkDependenciesForProject(project)
    const linksWithAbsolutePath = linksWithRelativePath.map(link => ({
      sourcePath: path.join(this.packagePath, link.sourcePathName, link.relativeSourcePath),
      linkPath: path.join(this.packagePath, link.destinationPathName, link.relativeLinkPath)
    }))

    return createSymlinks(linksWithAbsolutePath)
  }

  static createPackage(packagePath: string, packageData: Package) {
    const packageMetadata = JSON.stringify(packageData)

    try {
      fs.writeFileSync(path.join(packagePath, 'sked.pkg.json'), packageMetadata)
    } catch (error) {
      console.error(`Cannot write sked.pkg.json file to ${packagePath}.`)
      throw error
    }
  }

  private resolveLinkDependenciesForProject(project: ProjectService<any>) {
    const pathName = project.pathName

    return this.packageMetadata.linkedComponents
      .filter(link => link.dependants.map(d => d.item).includes(pathName))
      .map(link => {
        const dependantMetadata = link.dependants.find(d => d.item === pathName)

        return {
          sourcePathName: link.source,
          destinationPathName: pathName,
          relativeSourcePath: link.sourcePath || DEFAULT_LINK_SOURCE_PATH,
          relativeLinkPath: dependantMetadata!.linkPath || DEFAULT_LINK_DESTINATION_PATH
        }
      })
  }

  private bundlePackage() {
    const buildAssetsPath = path.join(this.packagePath, '/pre_deploy_assets')

    if (!fs.existsSync(buildAssetsPath)) {
      fs.mkdirSync(buildAssetsPath)
    }

    const targetPackageFile = path.join(buildAssetsPath, '/package.tar.gz')
    return createTarBall(this.packagePath, targetPackageFile, tarballFileFilter)
  }

  private async uploadPackage(bundlePath: string, pkg: Package): Promise<SourceUploaded> {
    const metadata = pkg

    const formData = {
      name: pkg.name,
      hash: getFileHash(bundlePath),
      source: fs.createReadStream(bundlePath),
      metadata: JSON.stringify(metadata)
    }

    return this.apiRequest.post({
      url: `/pkg/source/${encodeURIComponent(metadata.name)}`,
      formData,
      json: true
    })
      .then(res => res.result as SourceUploaded)
  }

  private startBuild(name: string, hash: string) {
    return this.apiRequest.post({
      url: `/pkgr/build`,
      body: {
        name, hash, action: 'deploy'
      }
    })
  }

  private getAllProjectNames() {
    const components = this.packageMetadata.components

    return _.flatten(Object
      .keys(components)
      .map((key: keyof Package['components']) => components[key])
      .filter(list => !!list!['items'])
      .map(list => list!['items']))
  }

  private checkForRequiredScripts(projectNames: string[], deployErrors: IPreDeployErrors) {
    let errors = deployErrors

    projectNames
      .map(name => {
        const projectPackageFile = path.join(this.packagePath, name, 'package.json')
        const currentProjectErrors = Option.of(errors).next(name).getOrElse([])
        const errorSet = new Set()

        try {
          const packageData = JSON.parse(fs.readFileSync(projectPackageFile, 'utf8'))
          const currentScripts = Object.keys(Option.of(packageData).next('scripts').getOrElse({}))
          const currentScriptSet = new Set(currentScripts) as Set<string>

          REQUIRED_PROJECT_SCRIPTS.map(script => {
            if (!currentScriptSet.has(script)) {
              errorSet.add(`Does not have the ${script} script in package.json. Please add the script.`)
            }
          })

        } catch (_error) {
          errorSet.add(`No package.json file found in ${name} project`)
        }

        errors = Lens(name).over(_item => [ ...currentProjectErrors, ...errorSet ])(errors) as IPreDeployErrors
      })

    return errors
  }

  preDeployChecks() {
    const projectNames = this.getAllProjectNames()
    const defaultDeployErrors = projectNames.reduce((acc, cur) => ({ ...acc, [cur]: [] }), {})

    return this.checkForRequiredScripts(projectNames, defaultDeployErrors) as IPreDeployErrors
  }

  async deploy(setDeployStatus: (status: string | null) => void) {
    const pkg = this.evaluate(this.packageMetadata)

    try {
      const bundlePath = await this.bundlePackage()
      if (bundlePath) { setDeployStatus('Bundle success!') }

      const deployedPackage = await this.uploadPackage(bundlePath, pkg)
      const { name, hash } = deployedPackage
      if (name && hash) { setDeployStatus('Upload success!') }

      await this.startBuild(name, hash)
    } catch (error) {
      throw new Error(error)
    }
  }
}

function createTarBall(destFolder: string, destFile: string, filter: (path: string) => boolean) {

  return tar
    .c({
      file: destFile,
      cwd: destFolder,
      gzip: true,
      filter
    }, ['.'])
    .then(() => destFile)
}

function tarballFileFilter(filePath: string) {
  return !(/node_modules|pre_deploy_assets|__shared|__generated|.git|dist/.test(filePath))
}


function getFileHash(file: string) {
  const hash = crypto.createHash('sha256')
  const f = fs.readFileSync(file)
  hash.update(f)

  return hash.digest('hex')
}
