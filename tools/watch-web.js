
const fs = require('fs')
const { spawn } = require('child_process')
const shelljs = require('shelljs')

const cmd = shelljs.which('yarn').toString()
const subProcesses = [
  spawn(cmd, ['watch-styles'], { stdio: 'inherit' }),
  spawn(cmd, ['watch-scripts'], { stdio: 'inherit' })
]

subProcesses.forEach(p => {

  p.on('error', e => {
    console.error(e)
    exit()
  })

  p.on('exit', exit)
})

function exit() {
  subProcesses.forEach(p => {
    try {
      p.kill()
    } catch (e) {}
  })
}

process.on('SIGINT', exit)
process.on('SIGTERM', exit)
