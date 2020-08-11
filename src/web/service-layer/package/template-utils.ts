import * as path from 'path'

import { WEB_BASE_PATH } from '../../web-base-path'
import { MobilePageBoilerplateSuite } from './interproject-utils'

const TEMPLATE_PATH = path.join(WEB_BASE_PATH, '/assets/templates/')

export function getFunctionProjectTemplate() {
  return {
    name: 'Function project boilerplate',
    path: path.join(TEMPLATE_PATH, 'function-handler.tar.gz')
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
    path: path.join(TEMPLATE_PATH, 'jp-typegen-library.tar.gz')
  }
}

export function getMobileSuiteTemplates() {
  return [
    {
      name: 'Job Products Boilerplate Suite',
      type: MobilePageBoilerplateSuite.JobProducts,
      viewPath: path.join(TEMPLATE_PATH, 'jp-mobile-view.tar.gz'),
      functionPath: path.join(TEMPLATE_PATH, 'jp-mobile-fn.tar.gz'),
      libraryPath: path.join(TEMPLATE_PATH, 'jp-typegen-library.tar.gz')
    },
    {
      name: 'Job Attachments Boilerplate Suite',
      type: MobilePageBoilerplateSuite.JobAttachments,
      viewPath: path.join(TEMPLATE_PATH, 'attach-mobile-view.tar.gz'),
      functionPath: path.join(TEMPLATE_PATH, 'attach-mobile-fn.tar.gz')
    }
  ]
}
