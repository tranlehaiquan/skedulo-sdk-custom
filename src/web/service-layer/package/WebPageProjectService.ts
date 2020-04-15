import { Observable } from 'rxjs'
import { validateFor, WebPageProject } from '@skedulo/packaging-internal-commons'

import { LogItem } from '../../utils/shell'
import { proxyTo } from '../../utils/proxy'
import { SessionData } from '../types'
import { ProjectService } from './ProjectService'


export class WebPageProjectService extends ProjectService<WebPageProject> {

  static at(packagePath: string, projectName: string, session: SessionData): WebPageProjectService {
    return new WebPageProjectService(packagePath, projectName, session)
  }

  static async create(packagePath: string, projectName: string, template: string, projectData: WebPageProject, session: SessionData): Promise<WebPageProjectService> {
    validateFor<WebPageProject>('WebPageProject', projectData)

    await this.setupProject(packagePath, projectName, template, projectData)

    return this.at(packagePath, projectName, session)
  }


  evaluate(data: any) {
    return validateFor<WebPageProject>('WebPageProject', data)
  }

  getDevUrl() {
    return `${this.session.origin}/c-dev/`
  }

  startDev(port: number) {
    // Start the compiler and "dev" mode
    const dev$ =  this.dev({ SKED_PORT: `${port}` }).map(item => {
      item.value = 'dev: ' + item.value.trim()
      return item
    })

    const proxyServer$ = proxyTo({ port }, { port: 1929 })

    const proxy$ = dev$
      .take(1)
      .switchMap(() => this.testBuildToolingStart(port))
      .switchMap(() => proxyServer$)

    return dev$
      .merge(proxy$.switchMap(() => Observable.never()))
      .share() as Observable<LogItem>
  }


  private testBuildToolingStart(port: number) {
    return Observable
      .timer(1000)
      .take(1)
      .switchMap(() => {
        return Observable.fromPromise(
          fetch(`http://localhost:${port}/index.html`)
        )
      })
      .retry(15)
      .catch(() => {
        console.log('Failed to connect to SDK server')

        return Observable.empty()
      })
  }
}
