/**
 * "Web" side services
 */

import * as fs from 'fs'
import * as path from 'path'
import { Observable } from 'rxjs'

import { proxyTo } from '../utils/proxy'
import { extractTarball, createTarBall, getFileHash } from '../utils/tar'
import { LogItem, shellExec } from '../utils/shell'
import { WEB_BASE_PATH } from '../web-base-path'
import { ICoverage, ProjectData, SessionData } from './types'
import { NetworkingService } from './NetworkingService'

export { LogItem } from '../utils/shell'

type ProjectDataType = ProjectData

const TEMPLATE_PATH = path.join(WEB_BASE_PATH, '/assets/templates/')
const proxyServer = proxyTo({ port: 3000 }, { port: 1929 })

export class LegacyProjectServices {

  private apiRequest = (new NetworkingService(this.session)).getAPIRequest()
  constructor(private project: string, private session: SessionData) { }

  static getTemplates() {

    return [
      {
        name: 'React | Typescript | SASS (Recommended)',
        path: path.join(TEMPLATE_PATH, 'legacy-minimal-react-typescript.tar.gz')
      }
    ]
  }

  getProjectData(): ProjectData {

    try {
      const projData = fs.readFileSync(this.getProjectDataPath(), 'utf8')
      return JSON.parse(projData)
    } catch (error) {
      console.error('Project file sked.proj.json not found.')
      throw error
    }
  }

  getCoverageSummary(): ICoverage {
    try {
      const coverageData = fs.readFileSync(this.getCoverageSummaryPath(), 'utf8')
      return JSON.parse(coverageData)
    } catch (error) {
      console.error('Coverage file coverage-summary.json not found.')
      throw error
    }
  }

  private getProjectDataPath() {
    return path.join(this.project, '/sked.proj.json')
  }

  private getCoverageSummaryPath() {
    return path.join(this.project, '/coverage/coverage-summary.json')
  }

  static createProject(project: string, template: string, projectData: ProjectDataType, session: SessionData) {

    if (!fs.existsSync(project)) {
      fs.mkdirSync(project)
    }

    const proj = new LegacyProjectServices(project, session)

    return proj.extractTemplate(template)
      .then(() => proj.startBootstrap().toPromise())
      .then(() => proj.createProjectFile(projectData))
  }

  private extractTemplate(template: string) {
    return extractTarball(this.project, template)
  }

  private createProjectFile(projectData: ProjectDataType) {
    const json = JSON.stringify(projectData)
    fs.writeFileSync(this.getProjectDataPath(), json)
  }

  bundleProject() {
    const { project: destFolder, filter } = this

    const buildAssetsPath = path.join(destFolder, '/pre_deploy_assets')

    if (!fs.existsSync(buildAssetsPath)) {
      fs.mkdirSync(buildAssetsPath)
    }

    const pageFolder = path.join(destFolder, '/build')

    const prjPathBundle = path.join(buildAssetsPath, '/project.tar.gz')
    const pagePathBundle = path.join(buildAssetsPath, '/page.tar.gz')

    const projectTarballP = createTarBall(destFolder, prjPathBundle, filter)
    const pageTarballP = createTarBall(pageFolder, pagePathBundle, filter)

    return Promise.all([projectTarballP, pageTarballP])
      .then(() => ({
        page: pagePathBundle,
        project: prjPathBundle
      }))
  }

  startBootstrap() {
    return shellExec('yarn bootstrap', this.project).share()
  }

  startDev() {

    const command$ = shellExec('yarn start', this.project).share()

    const proxy$ = command$
      .take(1)
      .switchMap(() => this.testBuildToolingStart())
      .switchMap(() => proxyServer)

    return command$
      .merge(proxy$.switchMap(() => Observable.never()))
      .share() as Observable<LogItem>
  }

  startCoverage() {
    return shellExec('yarn coverage', this.project).share()
  }

  startBuild() {
    return shellExec('yarn build', this.project).share()
  }

  startDeploy() {
    const coverageP = this.startCoverage()
      .toPromise()
      .then(() => this.getCoverageSummary())

    const bundleP = coverageP
      .then(() => this.bundleProject())

    return Promise.all([coverageP, bundleP])
      .then(([coverage, { page, project }]) => this.uploadPackage(page, project, coverage))
  }

  private uploadPackage(page: string, project: string, coverage: ICoverage) {
    const metadata = Object.assign(this.getProjectData(), { coverage: coverage.total })

    const formData = {
      hash: getFileHash(page),
      page: fs.createReadStream(page),
      project: fs.createReadStream(project),
      metadata: JSON.stringify(metadata)
    }

    return this.apiRequest.post({
      url: `/packages/${encodeURIComponent(metadata.url)}`,
      formData,
      json: true
    })
  }

  getPackages(active: boolean = false) {
    return this.apiRequest.get(`/packages`, {
      qs: { active }
    })
  }


  private filter = (filePath: string) => {
    return !(/node_modules|pre_deploy_assets/.test(filePath))
  }

  private testBuildToolingStart() {
    return Observable
      .timer(1000)
      .take(1)
      .switchMap(() => {
        return Observable.fromPromise(
          fetch('http://localhost:3000/index.html')
        )
      })
      .retry(15)
      .catch(() => {
        console.log('Failed to connect to SDK server')

        return Observable.empty()
      })
  }
}
