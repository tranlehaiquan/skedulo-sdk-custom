import * as https from 'https'
import * as KCors from 'kcors'
import * as Koa from 'koa'
import * as KJsonError from 'koa-json-error'
import * as KLogger from 'koa-logger'

import { proxyTo } from './proxy'
import { setupRouter } from './routes'
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
setupRouter(app)

const server = https.createServer(SSLOptions, app.callback())

const host = 'localhost'
const port = 1928

server.listen(port, host, () => {
  console.info(`Start CP SDK... Running as https://${host}:${port}`)
})

const sub = proxyTo({ port: 3000 }, { port: 1929 }).subscribe()

server.on('close', () => {
  sub.unsubscribe()
})
