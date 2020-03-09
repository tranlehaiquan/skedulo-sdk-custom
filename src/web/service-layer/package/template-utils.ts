import * as path from 'path'

import { WEB_BASE_PATH } from '../../web-base-path'
import { MobilePageBoilerplateSuite } from './interproject-utils'

const TEMPLATE_PATH = path.join(WEB_BASE_PATH, '/assets/templates/')

export function getFunctionProjectTemplate() {
  return {
    name: 'Function project boilerplate',
    path: path.join(TEMPLATE_PATH, 'function-boilerplate.tar.gz')
  }
}

export function getWebpageProjectTemplate() {
  return {
    name: 'Webpage project boilerplate',
    path: path.join(TEMPLATE_PATH, 'minimal-react-typescript-package.tar.gz')
  }
}

export function getLibraryProjectTemplate() {
  return {
    name: 'Library project boilerplate',
    path: path.join(TEMPLATE_PATH, 'mcp-jp-types.tar.gz')
  }
}

export function getMobileSuiteTemplates() {
  return [
    {
      name: 'Job Products Boilerplate Suite',
      type: MobilePageBoilerplateSuite.JobProducts,
      viewPath: path.join(TEMPLATE_PATH, 'mcp-jp-view.tar.gz'),
      functionPath: path.join(TEMPLATE_PATH, 'mcp-jp-function.tar.gz'),
      libraryPath: path.join(TEMPLATE_PATH, 'mcp-jp-types.tar.gz')
    },
    {
      name: 'Job Attachments Boilerplate Suite',
      type: MobilePageBoilerplateSuite.JobAttachments,
      viewPath: path.join(TEMPLATE_PATH, 'mcp-attach-view.tar.gz'),
      functionPath: path.join(TEMPLATE_PATH, 'mcp-attach-function.tar.gz')
    }
  ]
}
