import { Observable } from 'rxjs'
import { MobilePageProject, validateFor } from '@skedulo/packaging-internal-commons'

import { SessionData } from '../types'
import { ProjectService } from './ProjectService'

export class MobilePageProjectService extends ProjectService<MobilePageProject> {

  static at(packagePath: string, projectName: string, session: SessionData): MobilePageProjectService {
    return new MobilePageProjectService(packagePath, projectName, session)
  }

  static async create(packagePath: string, projectName: string, template: string, projectData: MobilePageProject, session: SessionData): Promise<MobilePageProjectService> {
    validateFor<MobilePageProject>('MobilePageProject', projectData)

    await this.setupProject(packagePath, projectName, template, projectData)

    return this.at(packagePath, projectName, session)
  }

  evaluate(data: any) {
    return validateFor<MobilePageProject>('MobilePageProject', data)
  }

  startDev(port: number) {
    // Start the compiler and "dev" mode
    const devLog$ = this.dev({ SKED_PORT: `${port}` }).map(item => {
      item.value = 'dev: ' + item.value.trim()
      return item
    })

    // Starting ngrok after 3 seconds to account for errored starts.
    const ngrokSession$ = Observable
      .timer(3000)
      .switchMap(() => this.startNgrokAndProbe(port, this.project.name, this.project.type, this.project))

    return devLog$.merge(ngrokSession$)
  }
}
