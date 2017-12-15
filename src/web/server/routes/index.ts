import * as Koa from 'koa'
import * as Router from 'koa-router'

import BaseRoute from './base'
import { Channel } from '../../service-layer/types'

/**
 * Actual Router here
 */
const appRoute = new Router()

export function setupRouter(app: Koa, eventChannel: Channel) {

  const baseRoute = BaseRoute(eventChannel)

  appRoute.use(

    // Base route (/pig /ping)
    baseRoute.routes(),
    baseRoute.allowedMethods()
  )

  // Bind to the app
  return app.use(appRoute.routes())
}
