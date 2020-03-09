import { MobilePageProject, ProjectType, FunctionProject, NodeVersion, LibraryProject, ProjectDependencyType, Package } from '@skedulo/packaging-internal-commons'
import { SessionData } from '../types'
import { PackageService } from './PackageService'
import { getMobileSuiteTemplates } from './template-utils'
import { LibraryProjectService } from './LibraryProjectService'
import { FunctionProjectService } from './FunctionProjectService'
import { enumUnreachable } from '../../utils/types'
import { MobilePageProjectService } from './MobilePageProjectService'

export enum MobilePageBoilerplateSuite {
  JobProducts = 'JobProducts',
  JobAttachments = 'JobAttachments'
}

// The name referenced amongst the job products suite, still not exactly sure how to make
// this completely dynamic as the function and view boilerplate reference this library by its name
const JP_LIBRARY_NAME = 'mcp-jp-types'

export function createMobilePageSuite(
  suite: MobilePageBoilerplateSuite,
  packageService: PackageService,
  projectData: MobilePageProject,
  session: SessionData
) {
  switch(suite) {
    case MobilePageBoilerplateSuite.JobAttachments:
      return createJobAttachmentsMobileSuite(packageService, projectData, session)
    case MobilePageBoilerplateSuite.JobProducts:
      return createJobProductsMobileSuite(packageService, projectData, session)
    default:
      enumUnreachable(suite)
  }
}

async function createJobProductsMobileSuite(packageService: PackageService, coreProjectData: MobilePageProject, session: SessionData) {
  const templateForSuite = getMobileSuiteTemplates().find(s => s.type === MobilePageBoilerplateSuite.JobProducts)!

  const allProjectNamesInPackage = packageService.getAllProjectNames()

  if (!allProjectNamesInPackage.includes(JP_LIBRARY_NAME)) {
    // Only create the shared library if it does not yet exist
    const libraryMetadata: LibraryProject = {
      name: JP_LIBRARY_NAME,
      description: 'Shared types for Job Products mobile page suite',
      type: ProjectType.Library
    }

    await LibraryProjectService.create(
      packageService.packagePath,
      JP_LIBRARY_NAME,
      templateForSuite.libraryPath!,
      libraryMetadata,
      session
    )
  }

  const libraryDependencyData = {
    dependencyName: JP_LIBRARY_NAME,
    type: ProjectDependencyType.LocalNodeDependency,
    options: {
      devDependency: false
    }
  }
  
  // Create the lifecycle function
  const functionMetadata: FunctionProject = {
    name: coreProjectData.lifecycleFunction,
    description: 'Lifecycle function for Job Products mobile page suite',
    type: ProjectType.Function,
    runtime: NodeVersion.nodejs12,
    dependencies: [libraryDependencyData]
  }

  await FunctionProjectService.create(
    packageService.packagePath,
    coreProjectData.lifecycleFunction,
    templateForSuite.functionPath,
    functionMetadata,
    session
  )

  // Create the mobile page
  const coreProjectMetadata: MobilePageProject = {
    ...coreProjectData,
    dependencies: [libraryDependencyData]
  }

  await MobilePageProjectService.create(
    packageService.packagePath,
    coreProjectData.name,
    templateForSuite.viewPath,
    coreProjectMetadata,
    session
  )

  const newComponents: Package['components'] = {
    mobilepages: {
      items: [coreProjectData.name]
    },
    functions: {
      items: [coreProjectData.lifecycleFunction]
    },
    libraries: {
      items: [JP_LIBRARY_NAME]
    } 
  }

  // Update package with new components
  packageService.addPackageComponents(newComponents)
}

async function createJobAttachmentsMobileSuite(packageService: PackageService, coreProjectData: MobilePageProject, session: SessionData) {
  const templateForSuite = getMobileSuiteTemplates().find(s => s.type === MobilePageBoilerplateSuite.JobAttachments)!

  // Create the lifecycle function
  const functionMetadata: FunctionProject = {
    name: coreProjectData.lifecycleFunction,
    description: 'Lifecycle function for Job Attachments mobile page suite',
    type: ProjectType.Function,
    runtime: NodeVersion.nodejs12
  }
  
  await FunctionProjectService.create(
    packageService.packagePath,
    coreProjectData.lifecycleFunction,
    templateForSuite.functionPath,
    functionMetadata,
    session
  )
  
  await MobilePageProjectService.create(
    packageService.packagePath,
    coreProjectData.name,
    templateForSuite.viewPath,
    coreProjectData,
    session
  )

  const newComponents: Package['components'] = {
    mobilepages: {
      items: [coreProjectData.name]
    },
    functions: {
      items: [coreProjectData.lifecycleFunction]
    }
  }

  // Update package with new components
  packageService.addPackageComponents(newComponents)
}
