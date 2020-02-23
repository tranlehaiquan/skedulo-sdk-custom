import * as fs from 'fs'
import * as path from 'path'
import { LibraryProject, validateFor } from '@skedulo/packaging-internal-commons'

import { SessionData } from '../types'
import { ProjectService } from './ProjectService'
import { NPM_PACKAGE_FILE } from './constants'

export class LibraryProjectService extends ProjectService<LibraryProject> {

  static at(packagePath: string, projectName: string, session: SessionData): LibraryProjectService {
    return new LibraryProjectService(packagePath, projectName, session)
  }

  static async create(packagePath: string, projectName: string, template: string, projectData: LibraryProject, session: SessionData): Promise<LibraryProjectService> {
    await this.setupProject(packagePath, projectName, template, projectData)

    // Modify package.json to use name of project as the library name
    this.setLibraryName(path.join(packagePath, projectName), projectName)

    return this.at(packagePath, projectName, session)
  }

  static setLibraryName(projectPath: string, projectName: string) {
    const npmPackageFile = fs.readFileSync(path.join(projectPath, NPM_PACKAGE_FILE), 'UTF8')
    const npmPackage = JSON.parse(npmPackageFile)
    npmPackage['name'] = projectName
    fs.writeFileSync(path.join(projectPath, NPM_PACKAGE_FILE), JSON.stringify(npmPackage))
  }

  evaluate(data: any) {
    return validateFor<LibraryProject>('LibraryProject', data)
  }

  startDev() {
    // Start the compiler and "dev" mode
    const devLog$ = this.dev().map(item => {
      item.value = 'dev: ' + item.value.trim()
      return item
    })

    return devLog$
  }
}
