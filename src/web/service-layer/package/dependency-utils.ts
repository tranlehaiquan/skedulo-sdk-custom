import * as path from 'path'
import * as fs from 'fs'

import { keyBy } from 'lodash'
import { LocalNodeDependencyOptions, ProjectDependencyType, NodeProjectDependency, ProjectDependency, BaseCodeProject } from '@skedulo/packaging-internal-commons'

import { shellExec } from '../../utils/shell'
import { PROJECT_FILE } from './constants'

export interface NodeDepApplicationInfo {
  dependantPath: string
  dependencyPath: string
  dependencyName: string
  options: LocalNodeDependencyOptions
}

export interface NodeDepRemovalInfo {
  dependantPath: string
  dependencyName: string
}

export async function registerLocalNodeDependency(dependencyInfo: NodeDepApplicationInfo) {
  // Register a local dependency between both projects
  await yarnLocalAddCommand(
    dependencyInfo.dependantPath,
    dependencyInfo.dependencyPath,
    dependencyInfo.options.devDependency
  )
}

export async function deregisterLocalNodeDependency(dependencyInfo: NodeDepRemovalInfo) {
  // Unregister a local dependency between both projects
  await yarnLocalRemoveCommand(
    dependencyInfo.dependantPath,
    dependencyInfo.dependencyName
  )
}

export async function addLocalNodeDependencyToPackage(dependencyInfo: NodeDepApplicationInfo) {
  // Try and apply the link first before updating metadata
  await registerLocalNodeDependency(dependencyInfo)
  
  const dependencyObject: NodeProjectDependency = {
    type: ProjectDependencyType.LocalNodeDependency,
    dependencyName: dependencyInfo.dependencyName,
    options: dependencyInfo.options
  }

  const projectMetadata = getProjectFileForPackage(dependencyInfo.dependantPath)
  const updatedProjectFile = appendDependencyToProjectMetadata(projectMetadata, dependencyObject)
  setProjectFileForPackage(dependencyInfo.dependantPath, updatedProjectFile)
}

export async function removeLocalNodeDependencyFromPackage(dependencyInfo: NodeDepRemovalInfo) {
  await deregisterLocalNodeDependency(dependencyInfo)

  const projectMetadata = getProjectFileForPackage(dependencyInfo.dependantPath)
  const updatedProjectFile = removeDependencyFromProjectMetadata(projectMetadata, dependencyInfo.dependencyName)

  setProjectFileForPackage(dependencyInfo.dependantPath, updatedProjectFile)
}

export function isNodeDependency(x: ProjectDependency): x is NodeProjectDependency {
  return x.type === ProjectDependencyType.LocalNodeDependency
}

function getProjectFileForPackage(projectPath: string): BaseCodeProject {
  const projectFilePath = path.join(projectPath, PROJECT_FILE)
  const projectFileJson = fs.readFileSync(projectFilePath, 'UTF8')
  return JSON.parse(projectFileJson) as BaseCodeProject
}

function setProjectFileForPackage(projectPath: string, projectMetadata: BaseCodeProject) {
  const projectFilePath = path.join(projectPath, PROJECT_FILE)
  fs.writeFileSync(projectFilePath, JSON.stringify(projectMetadata))
}

function appendDependencyToProjectMetadata(projectMetadata: BaseCodeProject, dependencyMetadata: ProjectDependency): BaseCodeProject {
  const existingDependencies = projectMetadata.dependencies || []
  const dependenciesByName = keyBy(existingDependencies, dep => dep.dependencyName)

  const mergedDependencies = {
    ...dependenciesByName,
    [dependencyMetadata.dependencyName]: dependencyMetadata
  }

  return {
    ...projectMetadata,
    dependencies: Object.values(mergedDependencies) 
  }
}

function removeDependencyFromProjectMetadata(projectMetadata: BaseCodeProject, dependencyName: string): BaseCodeProject {
  const existingDependencies = projectMetadata.dependencies || []

  return {
    ...projectMetadata,
    dependencies: existingDependencies.filter(dep => dep.dependencyName !== dependencyName)
  }
}

function yarnLocalAddCommand(dependantPath: string, dependencyPath: string, devDependency: boolean) {
  /**
   * The only guarantee when it comes build time in other environments is the directory
   * structure from the root of the package.  For this reason, generate the relative path
   * between package directories so that they will still hold when package is built in
   * a different environment (i.e the build container in ECS)
   */
  const relativePathToDependency = path.relative(dependantPath, dependencyPath)
  const addCommandBase = `yarn add "link:${relativePathToDependency}"`
  const addCommand = devDependency
    ? addCommandBase.concat(' --dev')
    : addCommandBase

  return shellExec(addCommand, dependantPath, {}, true).toPromise()
}

function yarnLocalRemoveCommand(dependantPath: string, dependencyName: string) {
  return shellExec(`yarn remove ${dependencyName}`, dependantPath, {}, true).toPromise()
}
