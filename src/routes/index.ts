import * as Koa from 'koa'
import * as Router from 'koa-router'

import BaseRoute from './base'

/**
 * Actual Router here
 */

const appRoute = new Router()

export function setupRouter(app: Koa) {

  appRoute.use(

    // Base route (/pig /ping)
    BaseRoute.routes(),
    BaseRoute.allowedMethods()
  )

  // Bind to the app
  return app.use(appRoute.routes())
}
