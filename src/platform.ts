import * as os from 'os'

export type Platform = 'win' | 'osx' | 'unix'

const systemPlatform = os.platform()

export function getPlatform(): Platform | null {

  switch (systemPlatform) {
    case 'win32':
      return 'win'
    case 'darwin':
      return 'osx'
    case 'linux':
    case 'freebsd':
    case 'openbsd':
      return 'unix'
    default:
      return null
  }
}

export function whenPlatformIs(p: Platform, fn: () => void) {
  if (getPlatform() === p) {
    fn()
  }
}
