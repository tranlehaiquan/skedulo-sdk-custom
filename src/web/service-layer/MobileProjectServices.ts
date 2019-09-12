/**
 * "Web" side services
 */
import * as fs from 'fs'
import * as path from 'path'
import { Observable } from 'rxjs'
import * as tar from 'tar'
import * as zlib from 'zlib'
import { LogItem, shellExec } from '../utils/shell'
import { WEB_BASE_PATH } from '../web-base-path'
import { CustomFormServices, Definition } from './CustomFormServices'

import { MobileProjectData, SessionData } from './types'
import { connectToNgrok } from '../server/ngrok'

export { LogItem } from '../utils/shell'

const TEMPLATE_PATH = path.join(WEB_BASE_PATH, '/assets/templates/')
const RAW_COMPILED_ASSET_NAMES = ['node.js', 'native.js', 'node.js.map', 'native.js.map']

export class MobileProjectServices {

  private customFormServices = new CustomFormServices(this.session)

  constructor(private project: string, private session: SessionData) { }

  static getTemplates() {

    return [
      {
        name: 'Job Products: React | Typescript | SASS (Recommended)',
        path: path.join(TEMPLATE_PATH, 'job-products-mcp-react-typescript.tar.gz')
      },
      {
        name: 'Attachments: React | Typescript | SASS (Recommended)',
        path: path.join(TEMPLATE_PATH, 'attachments-mcp-react-typescript.tar.gz')
      }
    ]
  }

  getProjectData(): MobileProjectData {

    try {
      const projData = fs.readFileSync(this.getProjectDataPath(), 'utf8')
      return JSON.parse(projData)
    } catch (error) {
      console.error('Project file definition.json not found.')
      throw error
    }
  }

  private getProjectDataPath() {
    return path.join(this.project, '/definition.json')
  }

  static createProject(project: string, template: string, projectData: MobileProjectData, session: SessionData) {

    const proj = new MobileProjectServices(project, session)

    return proj.extractTemplate(template)
      .then(() => proj.startBootstrap().toPromise())
      .then(() => proj.createProjectFile(projectData))
  }

  private extractTemplate(template: string) {
    return extractTarball(this.project, template)
  }

  private createProjectFile(projectData: MobileProjectData) {
    const json = JSON.stringify(projectData)
    fs.writeFileSync(this.getProjectDataPath(), json)
  }

  async bundleProject(singleBundleDestination?: string) {

    const { project: destFolder } = this

    const buildAssetsPath = path.join(destFolder, '/pre_deploy_assets')

    if (!fs.existsSync(buildAssetsPath)) {
      fs.mkdirSync(buildAssetsPath)
    }

    // Create tarball of all entry points and their source maps
    const buildFolder = path.join(destFolder, '/build')

    // Generate viewSources asset
    const viewSourcesTarP = createTarBall(path.join(destFolder, '/src'), path.join(buildAssetsPath, '/viewSources.tar.gz'), ['.'])

    // Generate entry point assets
    const entryPointTarsP = RAW_COMPILED_ASSET_NAMES.map(name => {
      const sourceFile = path.join(buildFolder, '/' + name)
      const destFile = path.join(buildAssetsPath, '/' + name + '.gz')

      return gzipFile(sourceFile, destFile)
    })

    await Promise.all([...entryPointTarsP, viewSourcesTarP])

    // Append deployTime to definition and copy to asset folder
    // fs.copyFileSync(path.join(buildFolder, '/definition.json'), path.join(buildAssetsPath, '/definition.json'))

    // Single Tarball Bundle requested, gzip all and output to requested directory (not currently used in UI)
    if (singleBundleDestination) {
      await createTarBall(buildAssetsPath, path.join(singleBundleDestination, '/compiledCustomForm.tar.gz'), ['.'])
    }

    return JSON.parse(fs.readFileSync(path.join(buildAssetsPath, '/definition.json'), { encoding: 'utf8' })) as Definition
  }

  uploadForm(definition: Definition) {
    const fileList = fs.readdirSync(path.join(this.project, '/pre_deploy_assets')).map(file => path.join(this.project, '/pre_deploy_assets/', file))
    return this.customFormServices.deployForms(definition, fileList)
  }

  startBootstrap() {
    return shellExec('yarn bootstrap', this.project).share()
  }

  startNgrokProxy = (): Observable<never> => {

    return new Observable<never>(obs => {
      let url: string | null = null

      const ngrok$ = connectToNgrok(9050)
        .subscribe(
          ngrokUrl => {
            url = ngrokUrl
          },
          err => obs.error(err)
        )

      return () => {
        ngrok$.unsubscribe()
        console.log(url)
      }
    })
  }

  getEnv = () => ({ SKED_BASE_URL: this.session.API_SERVER, SKED_API_TOKEN: this.session.token })

  startDev(): Observable<LogItem> {

    const command$ = shellExec(`yarn start`, this.project, this.getEnv()).share()

    // Starting ngrok proxy after 3 seconds to account for errored starts in the source command
    const startNgrokAfterThreeSeconds$ = Observable.timer(3000).switchMap(() => this.startNgrokProxy())
    return command$.takeUntil(startNgrokAfterThreeSeconds$).share()
  }

  startBuild() {
    return shellExec('yarn compile', this.project, this.getEnv()).share()
  }

  startDeploy() {
    return this.bundleProject().then(definition => this.uploadForm(definition))
  }
}

function extractTarball(destFolder: string, tarball: string) {

  return tar.x({
    cwd: destFolder,
    file: tarball
  })
}

function createTarBall(destFolder: string, destFile: string, sourceFilePaths: string[], filter?: (path: string) => boolean) {

  return tar
    .c({
      file: destFile,
      cwd: destFolder,
      gzip: true,
      filter
    }, sourceFilePaths)
    .then(() => destFile)
}

function gzipFile(source: string, dest: string) {
  return new Promise<string>((resolve, reject) => {

    const sourceStream = fs.createReadStream(source)
    const destStream = fs.createWriteStream(dest)
    const gzip = zlib.createGzip()

    sourceStream
      .pipe(gzip)
      .pipe(destStream)
      .on('finish', () => resolve(dest))
      .on('error', reject)
  })
}
