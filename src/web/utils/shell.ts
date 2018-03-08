import { ChildProcess, spawn } from 'child_process'
import * as _ from 'lodash'
import { Observable } from 'rxjs'
import * as shell from 'shelljs'

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

export function shellExec(command: string, cwd?: string) {

  return new Observable<LogItem>(observer => {

    const platform = getPlatform()

    let child: ChildProcess

    if (platform === 'win') {
      child = windowsExec(command, cwd)
    } else {
      child = unixExec(command, cwd)
    }

    addProcess(child)

    const stdout$ = streamToRx<string>(child.stdout)
    const stderr$ = streamToRx<string>(child.stderr)

    const sub = Observable
      .merge(
      stdout$.map((out): LogItem => ({ type: 'out', value: out })),
      stderr$.map((out): LogItem => ({ type: 'err', value: out }))
      )
      .subscribe(val => observer.next(val), err => observer.error(err), () => observer.complete())

    return () => {
      child.kill()
      sub.unsubscribe()

      // If already killed
      killOrRemoveProcess(child.pid)
    }
  })
}

function windowsExec(command: string, cwd?: string) {

  // Change to "Current Working Directory"
  if (cwd) {
    shell.cd(cwd)
  }

  return shell.exec(command, { async: true, silent: true }) as ChildProcess
}

function unixExec(command: string, cwd?: string) {

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
    { stdio: 'pipe', cwd, env: _.omit(process.env, 'PREFIX') }
  )

  child.stderr.setEncoding('utf8')
  child.stdout.setEncoding('utf8')

  return child
}

/**
 * Process Management ( side-state )
 */

const runningProcesses: { [key: number]: ChildProcess } = {}

function cleanupRunningProcesses() {
  Object.values(runningProcesses).map(cp => cp.kill())
}

function addProcess(cp: ChildProcess) {
  runningProcesses[cp.pid] = cp
}

function killOrRemoveProcess(pid: number) {
  const cp = runningProcesses[pid]

  // Kill Process if its still running
  if (cp && !cp.killed) {
    cp.kill()
  }

  // Remove the process from internal lists
  Reflect.deleteProperty(runningProcesses, pid)
}

declare const window: any
window.addEventListener('beforeunload', cleanupRunningProcesses)

