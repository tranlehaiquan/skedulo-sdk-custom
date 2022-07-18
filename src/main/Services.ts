import * as _ from 'lodash'
import { BrowserWindow, dialog, MessageBoxOptions } from 'electron'
import * as getPort from 'get-port'
import * as os from 'os'

import { getPlatform, whenPlatformIs } from '../platform'
import { log } from '../web/logging/logWrapper'

export class Services {

  private processIds: Set<number> = new Set()
  constructor(private win: BrowserWindow) {

    win.on('close', () => {
      console.info('Window is closing...')
      this.closeAllChildProcess()
    })
  }

  addChildProcess(pid: number) {
    console.info(`Process ${pid} added`)
    this.processIds.add(pid)
  }

  removeChildProcess(pid: number) {
    console.info(`Process ${pid} terminated`)
    this.processIds.delete(pid)
  }

  closeChildProcess(pid: number) {
    console.info(`Process ${pid} killed`)
    this.killOrRemoveProcess(pid)
  }

  closeAllChildProcess() {

    console.info('Closing all child processes...')

    return Array.from(this.processIds)
      .forEach(pid => this.killOrRemoveProcess(pid))
  }

  selectDirectory() {
    return dialog.showOpenDialog(this.win, {
      properties: ['openDirectory', 'createDirectory']
    })
  }

  showAndLogErrorMessage(title: string, content: string, logContent: string) {
    log(logContent)
    return dialog.showErrorBox(title, content)
  }

  showMessageBox(options: MessageBoxOptions) {
    return dialog.showMessageBox(this.win, options)
  }

  focus() {
    // Windows hack: https://github.com/electron/electron/issues/2867.
    whenPlatformIs('win', () => this.win.setAlwaysOnTop(true))
    this.win.focus()
    whenPlatformIs('win', () => this.win.setAlwaysOnTop(false))
  }

  async getPort(): Promise<number> {
    return await getPort()
  }

  getLanIp(): string | null {
    const externalInterface = _.flatten(Object.values(os.networkInterfaces()))
      .filter(i => i.family === 'IPv4')
      .find(i => i.internal === false)

    return externalInterface ? externalInterface.address : null
  }

  private killOrRemoveProcess(pid: number) {

    try {
      if (getPlatform() === 'unix' || getPlatform() === 'osx') {
        process.kill(-pid)
      } else {
        process.kill(pid)
      }
    } catch (e) {
      console.error(e)
    }

    // Remove the process from internal lists
    this.processIds.delete(pid)
  }
}
