/**
 * "Web" side services
 */
import * as fs from 'fs'
import * as path from 'path'
import { Observable } from 'rxjs'
import * as tar from 'tar'
import * as _ from 'lodash'
import * as zlib from 'zlib'

import { LogItem, shellExec } from '../utils/shell'
import { WEB_BASE_PATH } from '../web-base-path'
import { SessionData } from './types'
import { MobileProjectData } from './types'
import { Definition, LegacyCustomFormServices } from './LegacyCustomFormServices'

export { LogItem } from '../utils/shell'

// Fix PATH! for OSX
require('fix-path')()

const TEMPLATE_PATH = path.join(WEB_BASE_PATH, '/assets/templates/')
const RAW_COMPILED_ASSET_NAMES = ['node.js', 'main.js', 'native.js', 'node.js.map', 'main.js.map', 'native.js.map']

export class MobileProjectServices {

  private customFormServices = new LegacyCustomFormServices(this.session)

  constructor(private project: string, private session: SessionData) { }

  static getTemplates() {

    return [
      {
        name: 'React | Typescript | SASS (Recommended)',
        path: path.join(TEMPLATE_PATH, 'minimal-react-custom-form.tar.gz')
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
    // Specific configuration used to set a forms display type
    const resourceTypeDeployConfiguration = { deploy: { context: 'resource' } }

    const definitionAdditions = Object.assign(
      { projectName: projectData.projectName },
      projectData.formType === 'resource' ? resourceTypeDeployConfiguration : {}
    )

    this.updateProjectDefinition(this.getProjectDataPath(), definitionAdditions)
  }

  private updateProjectDefinition(pathToDefinition: string, additionalProperties: _.Dictionary<any>) {
    try {
      const existingDefinition = JSON.parse(fs.readFileSync(pathToDefinition, { encoding: 'utf8'}))
      const updatedDefinition = _.merge(existingDefinition, additionalProperties)

      fs.writeFileSync(pathToDefinition, JSON.stringify(updatedDefinition))
    } catch (error) {
      throw new Error('Unable to parse definition.json file.')
    }
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
    this.updateProjectDefinition(path.join(buildFolder, '/definition.json'), { meta: { deployTime: Date.now() } })
    fs.copyFileSync(path.join(buildFolder, '/definition.json'), path.join(buildAssetsPath, '/definition.json'))

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

  startDev() {
    // TODO: Initialize ID token to allow custom forms to make direct vendor calls
    const command$ = shellExec(`__BASE_URL__=${this.session.API_SERVER} __ACCESS_TOKEN__=${this.session.token} __ID_TOKEN__=stub yarn start`, this.project).share()

    return command$
      .share() as Observable<LogItem>
  }

  startBuild() {
    return shellExec('yarn build', this.project).share()
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
