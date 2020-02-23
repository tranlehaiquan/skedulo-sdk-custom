export enum ProjectScript {
  Bootstrap = 'bootstrap',
  Compile = 'compile',
  Dev = 'dev'
}

export const PACKAGE_FILE = 'sked.pkg.json'
export const PROJECT_FILE = 'sked.proj.json'
export const NPM_PACKAGE_FILE = 'package.json'
export const REQUIRED_PROJECT_SCRIPTS = [ProjectScript.Bootstrap, ProjectScript.Compile, ProjectScript.Dev]
