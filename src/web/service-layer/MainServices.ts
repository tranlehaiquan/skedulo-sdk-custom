/**
 * "Web" side services
 */
import { remote } from 'electron'

// NOTE: The path when doing a "remote-require" is from root of the project
import { Services } from '../../main/Services'
const MainServicesClass = remote.require('./main/Services').Services as (typeof Services)

// Fix PATH! for OSX
require('fix-path')()

export const MainServices = new MainServicesClass(remote.getCurrentWindow())

/**
 * JS Console Shortcut
 */
remote.globalShortcut.register('CommandOrControl+Shift+I', () => {
  const focusedWindow = remote.BrowserWindow.getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.webContents.openDevTools()
  }
})

window.addEventListener('beforeunload', () => {
  remote.globalShortcut.unregisterAll()
})
