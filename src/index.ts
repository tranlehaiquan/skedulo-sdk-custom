import * as url from 'url'
import * as path from 'path'

import { app, BrowserWindow } from 'electron'

let win: Electron.BrowserWindow

app.on('ready', () => {
  win = new BrowserWindow()

  // Open dev-tools on launch
  // win.webContents.openDevTools()

  // Prevent opening dev-tools
  win.webContents.on("devtools-opened", () => {
    win.webContents.closeDevTools()
  })

  // and load the index.html of the app.
  win.loadURL(url.format({
    pathname: path.join(__dirname, '../index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Everything has started up! Lets get this working
  require('./app')
})
