
import * as fs from 'fs'
import * as path from 'path'
import * as http from 'https'
import * as util from 'util'
const deZip = require('decompress-zip')

const PATHS = {
  osx: 'https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-darwin-amd64.zip',
  win: 'https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-windows-amd64.zip',
  linux: 'https://bin.equinox.io/c/4VmDzA7iaHb/ngrok-stable-linux-amd64.zip'
}

const TEMP_PATH = path.join(__dirname, '/.cache')
const mkDirAsync = util.promisify(fs.mkdir)

function keysOf<T extends { [key: string]: string }>(obj: T): (keyof T)[] {
  return Object.keys(obj) as any
}

async function init() {

  // Make cache dir if it dosen't exist
  try {
    await mkDirAsync(TEMP_PATH)
  } catch (e: any) {
    if (!e || e.code !== 'EEXIST') {
      throw e
    }
  }

  const downloads = keysOf(PATHS).map(async platform => {

    const url = PATHS[platform]
    const targetFileName = path.basename(url)
    const destinationFile = path.join(TEMP_PATH, '/', targetFileName)

    if (!fs.existsSync(destinationFile)) {

      console.log('Downloading ngrok for ' + platform)
      await downloadToLocation(url, destinationFile)

      console.log('Extract ngrok for ' + platform)
      await extractZip(destinationFile, path.join(TEMP_PATH, platform))

    } else {
      console.log('Found ngrok for ' + platform + '. Skipping ...')
    }
  })

  await Promise.all(downloads)
}

function extractZip(file: string, destinationPath: string) {
  return new Promise((resolve, reject) => {
    return new deZip(file)
      .extract({ path: destinationPath })
      .once('error', reject)
      .once('extract', resolve)
  })
}

function downloadToLocation(url: string, destinationFile: string) {

  const destinationStream = fs.createWriteStream(destinationFile)

  return new Promise((resolve, reject) => {

    http
      .get(url, res => {
        res.once('error', reject)
        res.once('end', () => resolve(destinationFile))

        res.pipe(destinationStream)
      })
      .once('error', reject)
  })
}

// Start everything
init()
