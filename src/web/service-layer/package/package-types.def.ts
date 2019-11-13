import { ProjectType, NodeVersion, Version, BuildAction, BuildStatus, WebPageType, WebPageHook } from './enums'

/**
 * Copied from SDK
 */

interface PackageComponents {
  functions?: {
    items: string[]
  }
  webpages?: {
    items: string[]
  }
  mobilepages?: {
    items: string[]
  },
  schemas?: {
    items: string[]
  }
}

interface PackageRelationship {
  primaryComponent: string,
  dependencies: string[]
}

interface PackageLinkDependant {
  item: string,
  linkPath?: string
}
interface PackageLink {
  source: string,
  sourcePath?: string,
  dependants: PackageLinkDependant[]
}

export interface Package {
  version: Version.One,

  /**
   * @minLength 3
   * @maxLength 64
   * @pattern ^[a-zA-Z0-9_\-]+$
   */
  name: string

  /**
   * @maxLength 2000
   */
  summary: string
  components: PackageComponents
  relationships: PackageRelationship[]
  linkedComponents: PackageLink[]
}

export interface  SelectedPackage {
  directory: string,
  metaData: Package
}

export interface BaseCodeProject {

  /**
   * @minLength 3
   * @maxLength 64
   */
  name: string

  /**
   * @minLength 3
   * @maxLength 500
   */
  description: string

  /**
   * @description Generate types for *.graphql files in this project
   */
  genTypes: boolean
}

/**
 * Name on a function should not have spaces, should only contain alpha-numeric, hyphens or underscores
 */
export interface FunctionProject extends BaseCodeProject {

  /**
   * @minLength 3
   * @maxLength 20
   * @pattern ^[a-zA-Z0-9_\-]+$
   */
  name: string

  type: ProjectType.Function

  runtime: NodeVersion.V810
}

export type WebPageRenderType = { type: WebPageType.Embedded, hook: WebPageHook, showInNavBar: boolean } | { type: WebPageType.Page, showInNavBar: boolean }

export interface WebPageProject extends BaseCodeProject {
  type: ProjectType.WebPage
  url: string
  render: WebPageRenderType | null
}

export interface MobilePageProject extends BaseCodeProject {
  type: ProjectType.MobilePage
  context: 'job' | 'resource'
  required: boolean
}

export interface SchemaProject extends Pick<BaseCodeProject, 'name' | 'description'> {
  type: ProjectType.Schema
}

/**
 * Local Types
 */

export interface DeployedFunctionDefinition {
  name: string
  version: string
  arn: string
  sha256: string
  modifiedDate: string
}

export interface AvailableFunctionConfiguration {
  functionName: string
  packageName: string
  runtime: string
  description: string
  handler: string
  archive: string
}

export interface DeployedMobilePageDefinition extends MobilePageProject {
  file: string
}

export interface DeployedWebPageDefinition extends WebPageProject {
  archive: string
}

export interface FinalPackage extends Package {
  release: {
    functions: {
      config: {
        [fnName: string]: AvailableFunctionConfiguration
      }
    }
    webpages: {
      mapping: {
        [pageName: string]: DeployedWebPageDefinition
      }
    }
    mobilepages: {
      mapping: {
        [pageName: string]: DeployedMobilePageDefinition
      }
    }
  }
}

export type BuildAction = BuildAction

export interface PackageSource {
  hash: string
  metadata: Package
  created: string
  createdBy: string
  revisionCount: number
}

export interface Build {
  id: string
  name: string
  source: {
    hash: string
    tenantId: string
  }
  metadata: BuildMetadata,
  created: string
  createdBy: string
  status: BuildStatus
}

export interface BuildMetadata {
  action: BuildAction
  packageMetadata: Package
  tasks: string[] | null
}

export interface PassedBuild extends Build {
  pkg: {
    metadata: FinalPackage
    files: { [key: string]: string }
  }
  started: string
  completed: string
}

export interface FailedBuild extends Build {
  started: string
  failed: string
}

export interface AvailablePackage {
  id: string
  name: string
  version: string
  source: {
    hash: string
    tenantId: string
  }
  metadata: FinalPackage
  created: string
  createdBy: string
  files: {
    [fileKey: string]: string
  }
  installedDate: string
  latestVersion: string
}

export interface InstalledPackage extends AvailablePackage {
  status: 'Installed' | 'Installing'
  config: PackageConfig
}

export interface PackageConfig {
  clientConfig: any
  release: {
    function: {
      mapping: {
        [functionName: string]: DeployedFunctionDefinition
      }
    }
  }
}

export interface FunctionPayload {
  method: 'get' | 'post' | 'put' | 'delete' | 'head' | string,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': string,
    'sked-api-server': string,
    [key: string]: string | undefined
  },
  path: string
  querystring: string
  body: any
}

/**
 * "Legacy Packages" / Connected Pages stack
 */
export interface IProjectData {
  version: number

  title: string
  description: string

  url: string
  menuID: string

  useFFB: boolean
  showInNavBar: boolean
}

export interface ConnectedPage {
  name: string
  hash: string
  active: boolean
  global: boolean
  createdDate: string
  metadata: IProjectData
}

export interface Schema {
  name: string
  description: string
  label: string
  fields: Field[]
  track?: boolean
}

export interface Field {
  name: string
  column: {
    type: string
    referenceSchemaName: string
    maxLength?: number
  }
  label: string
  description: string
  accessMode: string
  showDesktop: boolean
  showMobile: boolean
  editableOnMobile: boolean
  requiredOnMobile: boolean
}
