export enum ERROR_CODE {
  INVALID_DEV_STACK = 'INVALID_DEV_STACK',
  LOAD_PACKAGE_ERROR = 'LOAD_PACKAGE_ERROR',
  PACKAGE_ERROR = 'PACKAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DEPLOY_ERROR = 'DEPLOY_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class SkedError extends Error {
  errorCode: ERROR_CODE
  message: string

  constructor(message: string){
    super()
    this.message = message
    this.errorCode = ERROR_CODE.UNKNOWN_ERROR
  }
}

export class LoadPackageError extends SkedError {
  constructor(messageError: unknown){
    const message =  `Something went wrong when loading package.
    This may be an environment issue and therefore is not fatal however \
    some features of package development may not work as expected.  Error: ${messageError}`
    super(message)
    this.name = 'Failed to load package.'
    this.errorCode = ERROR_CODE.LOAD_PACKAGE_ERROR
  }
}

export class InvalidDevStackError extends SkedError {
  constructor(message: string) {
    super(message)
    this.name = 'Development Environment Error'
    this.errorCode = ERROR_CODE.INVALID_DEV_STACK
  }
}

export class InvalidPackageError extends SkedError {
  constructor(message: string) {
    super(message)
    this.name = 'Package Error'
    this.errorCode = ERROR_CODE.PACKAGE_ERROR
  }
}

export class ConnectionError extends SkedError {
  constructor(message: string) {
    super(message)
    this.name = 'Network Error'
    this.errorCode = ERROR_CODE.NETWORK_ERROR
  }
}

export class DeployError extends SkedError {
  constructor(message: string) {
    super(message)
    this.name = 'Deployment Error'
    this.errorCode = ERROR_CODE.DEPLOY_ERROR
  }
}