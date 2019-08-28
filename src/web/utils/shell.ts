import { ChildProcess, spawn } from 'child_process'
import * as _ from 'lodash'
import { Observable } from 'rxjs'
import * as shell from 'shelljs'
import * as semver from 'semver'
import { MainServices } from '../service-layer/MainServices'

import { getPlatform } from '../../platform'

export interface LogItem {
  type: 'out' | 'err',
  value: string
}

function streamToRx<T>(stream: NodeJS.ReadableStream) {
  return new Observable<T>(observer => {
    stream.on('end', () => observer.complete())
    stream.on('error', (e: Error) => observer.error(e))
    stream.on('data', (data: T) => observer.next(data))
  })
}

export function shellExec(command: string, cwd?: string, env: { [key: string]: string } = {}): Observable<LogItem> {

  return new Observable<ChildProcess>(observer => {

    const platform = getPlatform()

    let child: ChildProcess

    if (platform === 'win') {
      child = windowsExec(command, cwd, env)
    } else {
      child = unixExec(command, cwd, env)
    }

    observer.next(child)
    MainServices.addChildProcess(child.pid)

    let childClosed = false

    // Complete the "observable" when the child is "closed"
    child.on('close', () => {
      childClosed = true
      observer.complete()
    })

    return () => {

      if (childClosed) {
        // Use this method to safely "remove" the child-process
        // from the process-id list
        MainServices.removeChildProcess(child.pid)

      } else {
        // Use this method to close the child-process if its still "alive"
        MainServices.closeChildProcess(child.pid)
      }
    }
  })
    .switchMap(child => {
      const stdout$ = streamToRx<string>(child.stdout)
      const stderr$ = streamToRx<string>(child.stderr)

      return Observable.merge(
        stdout$.map((out): LogItem => ({ type: 'out', value: out })),
        stderr$.map((out): LogItem => ({ type: 'err', value: out }))
      )
    })
}

function windowsExec(command: string, cwd?: string, env: { [key: string]: string } = {}) {

  // Change to "Current Working Directory"
  if (cwd) {
    shell.cd(cwd)
  }

  return shell.exec(command, { async: true, silent: true, env }) as ChildProcess
}

function unixExec(command: string, cwd?: string, env: { [key: string]: string } = {}) {

  const shellEnv = process.env.SHELL || `/bin/bash`

  let rcFile: string

  if (shellEnv.includes('zsh')) {
    rcFile = '~/.zshrc'
  } else {
    rcFile = '~/.bashrc'
  }

  const sourceRcCommand = `if [ -f ${rcFile} ]; then source ${rcFile}; fi;`

  const child = spawn(
    process.env.SHELL as string,
    ['-c', `${sourceRcCommand} ${command}`],
    { stdio: 'pipe', cwd, env: { ..._.omit(process.env, 'PREFIX'), ...env }, detached: true }
  )

  child.stderr.setEncoding('utf8')
  child.stdout.setEncoding('utf8')

  return child
}

export function debugDevStack() {

  const yarnExists = shellExec('yarn --version')
    .last()
    .map(notification => {

      const versionRange = `>=1.3`
      const installLink = 'https://yarnpkg.com/lang/en/docs/install'

      if (notification.type === 'out') {
        const valid = semver.satisfies(notification.value, versionRange)

        return {
          valid,
          reason: valid ? null : `version must be ${versionRange}`,
          link: valid ? null : installLink
        }
      } else {
        return {
          valid: false,
          reason: `is not installed. Please ensure Yarn${versionRange} is installed and properly set on your $PATH`,
          link: installLink
        }
      }
    })

  const nodeExists = shellExec('node --version')
    .last()
    .map(notification => {

      const versionRange = `>=8.9`
      const installLink = 'https://nodejs.org/en/download/package-manager'

      if (notification.type === 'out') {
        const valid = semver.satisfies(notification.value, versionRange)

        return {
          valid,
          reason: valid ? null : `version must be ${versionRange}`,
          link: valid ? null : installLink
        }
      } else {
        return {
          valid: false,
          reason: `is not installed. Please ensure NodeJS${versionRange} is installed and properly set on your $PATH`,
          link: installLink
        }
      }
    })

  const openSSLExists = shellExec('openssl version')
    .last()
    .map(notification => {

      const versionRange = `>=1.1`

      let link: string | null = null

      switch (getPlatform()) {
        case 'win':
          link = `https://chocolatey.org/packages/OpenSSL.Light`
          break
        default:
          break
      }

      if (notification.type === 'out') {

        const coerced = semver.coerce(notification.value)
        const valid = coerced ? semver.satisfies(coerced.version, versionRange) : false

        return {
          valid,
          reason: valid ? null : `version must be ${versionRange}`,
          link
        }
      } else {
        return {
          valid: false,
          reason: `not found. Please ensure OpenSSL${versionRange} is installed and properly set on your $PATH`,
          link
        }
      }

    })

  return {
    openSSLExists,
    nodeExists,
    yarnExists
  }
}
