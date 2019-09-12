import * as ms from 'ms'
import { startLambdaServer } from '../../server/lambda-server'
import { validateFor } from '../schema-validation'
import { SessionData } from '../types'
import { FunctionProject } from './package-types.def'
import { ProjectService } from './ProjectService'

export class FunctionProjectService extends ProjectService<FunctionProject> {

  static at(packagePath: string, projectName: string, session: SessionData): FunctionProjectService {
    return new FunctionProjectService(packagePath, projectName, session)
  }

  evaluate(data: any) {
    return validateFor<FunctionProject>('FunctionProject', data)
  }

  getRemoteDevUrl() {
    return this.session.API_SERVER + `/pkgr/dev/function/${encodeURIComponent(this.project.name)}`
  }

  startDev(port: number) {

    // Start the compiler and "dev" mode
    const devLog$ = this.dev().map(item => {
      item.value = 'dev: ' + item.value.trim()
      return item
    })

    // Start "lambda" request handler
    const lambdaServer$ = startLambdaServer(port, this.projectPath, ms('60s')).map(item => {
      item.value = 'app: ' + item.value
      return item
    })

    // Start "ngrok" session
    const ngrokSession$ = this.startNgrokAndProbe(port, this.project.name, this.project.type, this.project)

    return lambdaServer$.merge(devLog$).merge(ngrokSession$)
  }
}
