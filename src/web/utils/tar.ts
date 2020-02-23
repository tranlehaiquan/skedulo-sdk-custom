import * as tar from 'tar'
import * as crypto from 'crypto'
import * as fs from 'fs'

export function extractTarball(destFolder: string, tarball: string) {

  return tar.x({
    cwd: destFolder,
    file: tarball
  })
}

export function createTarBall(destFolder: string, destFile: string, filter: (path: string) => boolean) {

  return tar
    .c({
      file: destFile,
      cwd: destFolder,
      gzip: true,
      filter
    }, ['.'])
    .then(() => destFile)
}

export function getFileHash(file: string) {
  const hash = crypto.createHash('sha256')
  const f = fs.readFileSync(file)
  hash.update(f)
  return hash.digest('hex')
}
