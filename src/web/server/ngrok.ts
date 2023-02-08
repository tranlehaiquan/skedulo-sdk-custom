
// ignore ts
// @ts-ignore
import { ChildProcess } from 'child_process'
import * as logfmt from 'logfmt'
import * as path from 'path'
import { Observable } from 'rxjs'
import { getPlatform } from '../../platform'
import { MainServices } from '../service-layer/MainServices'
import { streamToRx } from '../utils/shell'
import * as crossSpawn from 'cross-spawn'

// interface NgrokLogBase {
//   t: string
//   lvl: 'info' | 'debug' | 'error'
//   msg: string
// }

// interface NgrokStartedTunnel {
//   msg: 'started tunnel',
//   url: string
// }

// type NgrokLog = NgrokLogBase & NgrokStartedTunnel

const RESOURCES_PATH = process.env.NODE_ENV === 'development'
  ? require('electron').remote.app.getAppPath()
  : process.resourcesPath!

const NGROK_BASE_PATH = path.join(RESOURCES_PATH, '/app/assets/')

const binFile: { [key: string]: string } = {
  win: 'ngrok-win.exe',
  osx: 'ngrok-osx',
  unix: 'ngrok-linux'
}

const platform = getPlatform()

export function connectToNgrok(port: number) {

  return new Observable<ChildProcess>(observer => {

    if (!platform) {
      return observer.error(new Error('Ngrok not found for platform: ' + platform))
    }

    const binaryFile = binFile[platform]

    let childClosed = false

    const child = crossSpawn(`./${binaryFile}`, [
      'http',
      '--log=stdout',
      '--inspect=false',
      '--bind-tls=true',
      `${port}`
    ], {
      detached: true,
      cwd: NGROK_BASE_PATH
     })

    MainServices.addChildProcess(child.pid)
    observer.next(child)

    child?.stderr?.setEncoding('utf8')
    child?.stdout?.setEncoding('utf8')

    child.once('error', observer.error.bind(observer))
    child.once('close', () => {
      childClosed = true
      observer.complete()
    })

    return () => {
      if (childClosed) {
        MainServices.removeChildProcess(child.pid)
      } else {
        MainServices.closeChildProcess(child.pid)
      }
    }
  })
    .switchMap(child => {
      const stdout$ = child.stdout
        ? streamToRx<string>(child.stdout)
        : Observable.empty<string>()
      const stderr$ = child.stderr
        ? streamToRx<string>(child.stderr)
        : Observable.empty<string>()

      return stdout$.merge(stderr$)
        .map(logline => logfmt.parse(logline))
        .switchMap(logItem => {
          if (logItem.msg === 'started tunnel') {
            return Observable.of(logItem.url)
          } else {
            return Observable.empty<string>()
          }
        })
    })
}
