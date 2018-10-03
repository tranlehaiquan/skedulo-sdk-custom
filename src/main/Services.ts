import { BrowserWindow, dialog } from 'electron'
import { whenPlatformIs, getPlatform } from '../platform'

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

  focus() {
    // Windows hack: https://github.com/electron/electron/issues/2867.
    whenPlatformIs('win', () => this.win.setAlwaysOnTop(true))
    this.win.focus()
    whenPlatformIs('win', () => this.win.setAlwaysOnTop(false))
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
