import * as _ from 'lodash'
import * as fs from 'fs'
import * as path from 'path'
import { mapValues, keyBy, omitBy, flatten } from 'lodash'

import { Option, Lens } from '@skedulo/sked-commons'
import { Package, validateFor, ProjectDependency, FunctionProject, MobilePageProject, WebPageProject, LibraryProject, ProjectType } from '@skedulo/packaging-internal-commons'

import { getFileHash, createTarBall } from '../../utils/tar'
import { SessionData } from '../types'
import { NetworkingService } from '../NetworkingService'
import { FunctionProjectService } from './FunctionProjectService'
import { MobilePageProjectService } from './MobilePageProjectService'
import { WebPageProjectService } from './WebPageProjectService'
import { LibraryProjectService } from './LibraryProjectService'
import { registerLocalNodeDependency, isNodeDependency } from './dependency-utils'
import { PACKAGE_FILE, REQUIRED_PROJECT_SCRIPTS } from './constants'
import { ProjectService } from './ProjectService'

export interface IPreDeployErrors {
  [key: string]: string[]
}

export enum DATA_SOURCE_TYPE {
  STANDALONE = 'standalone',
  ELASTIC_SERVER = 'elasticserver'
}

interface SourceUploaded {
  name: string
  hash: string
  metadata: Package
  created: string
  createdBy: string
  revisionCount: number
}

export type AllProjectService = ProjectService<FunctionProject> | ProjectService<MobilePageProject> | ProjectService<WebPageProject> | ProjectService<LibraryProject>

enum USE_PKGR {
  YES = 'YES',
  NO = 'NO'
}

export function isMobileProjectService(project: AllProjectService): project is ProjectService<MobilePageProject> {
  return project.project.type === ProjectType.MobilePage
}

export class InvalidPackage extends Error { }

export class PackageService {

  private apiRequest = (new NetworkingService(this.session)).getAPIRequest()

  packageMetadata: Package
  webpages: WebPageProjectService[] = []
  mobilepages: MobilePageProjectService[] = []
  lambdas: FunctionProjectService[] = []
  libraries: LibraryProjectService[] = []

  static at(packagePath: string, session: SessionData) {
    return new PackageService(packagePath, session)
  }

  private constructor(public packagePath: string, private session: SessionData) {

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

  load() {
    // Link all dependencies.  All linking should be idempotent, if previously done this will have no effect
    // however this will ensure that the package is ready for development each time it's opened.
    return this.linkDependencies()
  }

  async linkDependencies() {
    const projectDependencies = this.getDependenciesForPackage()

    const allNodeDependencyLinks = flatten(Object.keys(projectDependencies).map(key => {
      const { dependencies, dependantPathName } = projectDependencies[key]
      const fullDependantPath = path.join(this.packagePath, dependantPathName)

      const nodeDependencies = dependencies.filter(isNodeDependency)

      return nodeDependencies.map(dep => { 
        const fullDependencyPath = path.join(this.packagePath, dep.dependencyPathName)

        return {
          ...dep,
          dependantPath: fullDependantPath,
          dependencyPath: fullDependencyPath
        }
      })
    }))

    // Apply each local node link
    await Promise.all(allNodeDependencyLinks.map(registerLocalNodeDependency))
  }

  getPackageMetadata() {
    return this.packageMetadata
  }

  evaluate(data: any) {

    const packageMetadata = validateFor<Package>('Package', data)

    const { webpages, mobilepages, functions, libraries } = packageMetadata.components

    this.webpages = webpages ? webpages.items.map(c => WebPageProjectService.at(this.packagePath, c, this.session)) : []
    this.mobilepages = mobilepages ? mobilepages.items.map(c => MobilePageProjectService.at(this.packagePath, c, this.session)) : []
    this.lambdas = functions ? functions.items.map(c => FunctionProjectService.at(this.packagePath, c, this.session)) : []
    this.libraries = libraries? libraries.items.map(c => LibraryProjectService.at(this.packagePath, c, this.session)) : []

    // Validate standard library dependencies
    this.evaluateLibraryDependencies()

    // Validate interproject dependencies (eg mobile page -> lifecycle function)
    this.evaluateInterprojectDependencies()
    
    return packageMetadata
  }

  private getDependenciesForPackage = () => {
    const allProjectsByName = keyBy([...this.webpages, ...this.mobilepages, ...this.lambdas, ...this.libraries], x => x.project.name)

    return omitBy(mapValues(allProjectsByName, service => ({
        dependantPathName: service.pathName,
        dependencies: (service.project.dependencies || []).map(dep => {
          if (!allProjectsByName[dep.dependencyName]) {
            throw new Error(`Unable to find library dependency ${dep.dependencyName} for project ${service.project.name}`)
          }

          return {
            ...dep,
            dependencyPathName: allProjectsByName[dep.dependencyName].pathName
          }
        })
    })), x => !x.dependencies.length)
  }

  evaluateInterprojectDependencies() {
    // Validate that the associated functions for mobile pages exist
    const allFunctionNames = this.lambdas.map(λ => λ.project.name)

    this.mobilepages.forEach(service => {
      const functionDependency = service.project.lifecycleFunction

      if (!allFunctionNames.includes(functionDependency)) {
        throw new Error(`Function dependency ${functionDependency} for project ${service.project.name} does not exist.`)
      }
    })
  }

  evaluateLibraryDependencies() {
    const projectsWithDependencies = [...this.webpages, ...this.mobilepages, ...this.lambdas, ...this.libraries]
      .reduce((result, currService) => ({
        ...result,
        [currService.project.name]: currService.project.dependencies || []
      }), {} as { [projectName: string]: ProjectDependency[] })

    const allLibraryNames = this.libraries.map(x => x.project.name)

    mapValues(projectsWithDependencies, (dependencies, projectName) => {
      const projectDeps = dependencies.map(x => x.dependencyName)

      projectDeps.forEach(depName => {
        if (!allLibraryNames.includes(depName)) {
          // Dependency does not exist within the package
          throw new Error(`Library dependency ${depName} for project ${projectName} does not exist.`)
        } else {
          const dependenciesForDep = projectsWithDependencies[depName]
          if (dependenciesForDep.some(d => d.dependencyName === projectName)) {
            // Circuler reference of dependency
            throw new Error(`Dependency ${depName} for project ${projectName} is a circular reference.`)
          }
        }
      })
    })
  }

  addPackageComponents(newPackageComponents: Package['components']) {
    const mergedComponents = _.mapValues(newPackageComponents, (value, key: keyof Package['components']) => {
      const existingComponents = this.packageMetadata.components[key]?.items

      if (!existingComponents) {
        return value
      } else {
        return {
          items: _.uniq(value!.items.concat(existingComponents))
        }
      }
    })

    const updatedMetadata = {
      ...this.packageMetadata,
      components: {
        ...this.packageMetadata.components,
        ...mergedComponents
      }
    }

    // Write metadata to package file
    PackageService.createPackageMetadata(this.packagePath, updatedMetadata)

    // Update metadata for this class instance
    this.packageMetadata = updatedMetadata
  }

  getAllProjectNames() {
    const components = this.packageMetadata.components

    return _.flatten(Object
      .keys(components)
      .map((key: keyof Package['components']) => components[key])
      .filter(list => !!list!['items'])
      .map(list => list!['items']))
  }

  static createPackageMetadata(packagePath: string, packageData: Package) {
    const packageMetadata = JSON.stringify(packageData)

    try {
      fs.writeFileSync(path.join(packagePath, 'sked.pkg.json'), packageMetadata)
    } catch (error) {
      console.error(`Cannot write sked.pkg.json file to ${packagePath}.`)
      throw error
    }
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
      url: this.getPackageUrlBasedOnFlag(`/source/${encodeURIComponent(metadata.name)}`, process.env.USE_PKGR as USE_PKGR),
      formData,
      json: true
    })
      .then(res => res.result as SourceUploaded)
  }

  private startBuild(name: string, hash: string) {
    return this.apiRequest.post({
      url: this.getBuildUrlBasedOnFlag(`/pkgr/build`),
      body: {
        name, hash, action: 'deploy'
      }
    })
  }


  private getPackageUrlBasedOnFlag = (path: string, usePkgr: USE_PKGR = USE_PKGR.NO) => {
    return usePkgr === USE_PKGR.YES ? `/pkgr${path}?source=standalone` : `/pkg${path}`
  }

  private getBuildUrlBasedOnFlag = (path: string, usePkgr: USE_PKGR = USE_PKGR.NO) => {
    const sourceType = usePkgr === USE_PKGR.YES ? DATA_SOURCE_TYPE.STANDALONE : DATA_SOURCE_TYPE.ELASTIC_SERVER
    return `/pkgr${path}?source=${sourceType}`
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

function tarballFileFilter(filePath: string) {
  return !(/node_modules|pre_deploy_assets|__shared|__generated|.git|dist/.test(filePath))
}
