import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

import { omit } from 'lodash'

import * as Koa from 'koa'
import * as KLogger from 'koa-logger'
import * as KJsonError from 'koa-json-error'
import * as KCors from 'kcors'

import Router from './routes'

import { SSLOptions } from './ssl'

const app = new Koa()

// Koa JSON Error Printing and Handling
const errJsonOptions = {
  // Avoid showing the stacktrace in 'production' env
  postFormat: (e: Error, obj: Error) => process.env.NODE_ENV === 'production' ? omit(obj, 'stack') : obj
}

app.use(KJsonError(errJsonOptions))

// Request Logging
app.use(KLogger())

// Enable Cross Origin Requests
app.use(KCors())

// Attach all request handlers ( router ) to the app
Router(app)

const server = https.createServer(SSLOptions, app.callback())

const host = 'localhost'
const port = 1928

server.listen(port, host, () => {
  console.info(`Start CP SDK... Running as https://${host}:${port}`)
})

import { proxyTo } from './proxy'

const sub = proxyTo({ port: 3000 }, { port: 1929 }).subscribe()

server.on('close', () => {
  sub.unsubscribe()
})
