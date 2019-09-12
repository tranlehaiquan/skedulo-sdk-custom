import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import { createSymlinks } from '../../utils/symlink'
import { validateFor } from '../schema-validation'
import { FunctionProjectService } from './FunctionProjectService'
import { MobilePageProjectService } from './MobilePageProjectService'
import { ProjectService } from './ProjectService'
import { Package } from './package-types.def'
import { WebPageProjectService } from './WebPageProjectService'
import { SessionData } from '../types'
import { NetworkingService } from '../NetworkingService'
import * as tar from 'tar'
import * as crypto from 'crypto'
import { SchemaProjectService } from './SchemaProjectService';

const PACKAGE_FILE = `sked.pkg.json`

const DEFAULT_LINK_SOURCE_PATH = 'src/shared'
const DEFAULT_LINK_DESTINATION_PATH = 'src/__shared'

interface SourceUploaded {
  name: string
  hash: string
  metadata: Package
  created: string
  createdBy: string
  revisionCount: number
}

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

  async deploy() {
    const pkg = this.evaluate(this.packageMetadata)

    const bundlePath = await this.bundlePackage()
    const deployedPackage = await this.uploadPackage(bundlePath, pkg)

    await this.startBuild(deployedPackage.name, deployedPackage.hash)
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
