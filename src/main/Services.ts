import { BrowserWindow, dialog } from 'electron'

import { whenPlatformIs } from '../platform'

export class Services {

  constructor(private win: BrowserWindow) { }

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
}
