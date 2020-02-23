
import * as fs from 'fs'
import * as ms from 'ms'
import * as path from 'path'

import { BaseCodeProject } from '@skedulo/packaging-internal-commons'

import { Observable } from 'rxjs'
import { shellExec } from '../../utils/shell'
import { extractTarball } from '../../utils/tar'
import { connectToNgrok } from '../../server/ngrok'
import { NetworkingService } from '../NetworkingService'
import { SessionData } from '../types'
import { PROJECT_FILE } from './constants'

export class InvalidProject extends Error { }

export abstract class ProjectService<T> {

  protected apiRequest = (new NetworkingService(this.session)).getAPIRequest()
  protected projectPath: string

  public project: T
  public pathName: string

  protected constructor(protected packagePath: string, protected projectName: string, protected session: SessionData) {

    this.pathName = projectName
    this.projectPath = path.join(this.packagePath, '/', this.projectName)
    const prjFile = path.join(this.projectPath, '/', PROJECT_FILE)

    if (!fs.existsSync(prjFile)) {
      throw new InvalidProject(`Project file does not exist for ${this.projectName}`)
    }

    try {
      const proj = JSON.parse(fs.readFileSync(prjFile, 'utf8'))
      this.project = this.evaluate(proj)
    } catch (e) {
      throw new InvalidProject(`InvalidProject: ${e.message}`)
    }
  }

  abstract evaluate(data: any): T

  static async setupProject<U extends BaseCodeProject>(packagePath: string, projectName: string, template: string, projectData: U) {
    const projectPath = path.join(packagePath, '/', projectName)

    // Create directory for project
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath )
    } else {
      throw new Error(`The project path "${projectPath}" already exists!`)
    }

    // Extract template into directory
    await extractTarball(projectPath, template)

    // Create project metadata file
    this.createProjectFile(projectPath, projectData)
  }

  static getProjectMetadataPath(projectPath: string) {
    return path.join(projectPath, '/sked.proj.json')
  }

  static createProjectFile(projectPath: string, projectData: BaseCodeProject) {
    const json = JSON.stringify(projectData)
    fs.writeFileSync(this.getProjectMetadataPath(projectPath), json)
  }

  bootstrap() {
    return shellExec('yarn bootstrap', this.projectPath, this.getEnv())
  }

  getEnv = () => ({ SKED_BASE_URL: this.session.API_SERVER, SKED_API_TOKEN: this.session.token })

  dev(env: { [key: string]: string } = {}) {
    return shellExec('yarn dev', this.projectPath, { ...this.getEnv(), ...env })
  }

  protected startDevSession(url: string, name: string, type: string, metadata: T) {
    return this.apiRequest.post('/pkgr/dev/start-session', { body: { url, name, type, metadata }, json: true })
  }

  protected stopDevSession(url: string) {
    return this.apiRequest.post('/pkgr/dev/stop-session', { body: { url }, json: true })
  }

  protected startNgrokAndProbe(port: number, name: string, type: string, metadata: T) {
    return new Observable<never>(obs => {
      let url: string | null = null
      let timeCode: NodeJS.Timer | null = null

      const ngrok$ = connectToNgrok(port)
        .subscribe(
          ngrokUrl => {
            url = ngrokUrl

            return this.startDevSession(ngrokUrl, name, type, metadata)
              .then(() => {
                timeCode = setInterval(() => {
                  this.startDevSession(ngrokUrl, name, type, metadata)
                }, ms('50s'))
              })
              .catch(err => obs.error(err))
          },
          err => obs.error(err)
        )

      return () => {
        ngrok$.unsubscribe()

        if (url) {
          this.stopDevSession(url)
        }

        if (timeCode !== null) {
          clearInterval(timeCode)
        }
      }
    })
  }
}
