import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as url from 'url'

import { BASE_PATH } from './base-path'

let win: Electron.BrowserWindow | null

app.on('ready', () => {

  // Create "electron" window
  createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})


function createWindow() {
  // Create a "window", but don't show it
  win = new BrowserWindow({
    show: false,
    width: 1440,
    height: 768,
    icon: path.join(BASE_PATH, '/assets/icons/64x64.png')
  })

  // After the window has finished loading, this event
  // is fired at which point we show the window
  win.on('ready-to-show', () => {
    win!.show()
  })

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, './index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open dev-tools on launch
  // win.webContents.openDevTools()

  // Prevent opening dev-tools
  // when dev tools is "opened", immediately close it
  if (process.env.NODE_ENV !== 'development') {
    win.webContents.on('devtools-opened', () => {
      win!.webContents.closeDevTools()
    })
  }
}
