import * as https from 'https'
import * as KCors from 'kcors'
import * as Koa from 'koa'
import * as KJsonError from 'koa-json-error'
import { omit } from 'lodash'

import { Channel } from '../service-layer/types'
import { getSSLOptions } from '../utils/ssl'
import { setupRouter } from './routes'

export function start(eventChannel: Channel) {

  const app = new Koa()

  // Koa JSON Error Printing and Handling
  const errJsonOptions = {
    // Avoid showing the stacktrace in 'production' env
    postFormat: (_: Error, obj: Error) => {
      process.env.NODE_ENV === 'production' ? omit(obj, 'stack') : obj
    }
  }

  app.use(KJsonError(errJsonOptions))

  // Request Logging ( Only during "dev" )
  // app.use(require('koa-logger')())

  // Enable Cross Origin Requests
  app.use(KCors())

  // Attach all request handlers ( router ) to the app
  setupRouter(app, eventChannel)

  const server = https.createServer(getSSLOptions(), app.callback())

  const host = 'localhost'
  const port = 1928

  server.listen(port, host, () => {
    console.info(`Start CP SDK... Running as https://${host}:${port}`)
  })

  return () => {
    server.close()
  }
}
