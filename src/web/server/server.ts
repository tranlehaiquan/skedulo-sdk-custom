import * as https from 'https'
import * as KCors from '@koa/cors'
import * as Koa from 'koa'
import * as KJsonError from 'koa-json-error'
import { omit, noop } from 'lodash'

import { Channel } from '../service-layer/types'
import { getSSLOptions, sslCertsPresent } from '../utils/ssl'
import { setupRouter } from './routes'

export function start(eventChannel: Channel) {

  if (!sslCertsPresent()) {
    return noop
  }

  const app = new Koa()

  // Koa JSON Error Printing and Handling
  const errJsonOptions = {
    // Avoid showing the stacktrace in 'production' env
    postFormat: (_: Error, obj: Error) => {
      return process.env.NODE_ENV === 'production' ? omit(obj, 'stack') : obj
    }
  }

  app.use(KJsonError(errJsonOptions))

  // Request Logging ( Only during "dev" )
  if (process.env.NODE_ENV !== 'production') {
    app.use(require('koa-logger')())
  }

  app.use(KCors({
    //@ts-ignore new options @types/koa__cors is not up to date
    privateNetworkAccess: true
  }))

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
