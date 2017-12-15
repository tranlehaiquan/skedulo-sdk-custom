import * as Joi from 'joi'
import * as bodyParser from 'koa-bodyparser'
import * as Router from 'koa-router'

import { Channel, SessionData, EventType } from '../../service-layer/types'
import { JWTMiddleware } from '../middleware/jwt'
import { validationFnForSchema } from '../middleware/validator'

const jsonParser = bodyParser({
  enableTypes: ['json']
})

const EnvSchema = Joi.compile({
  REALTIME_SERVER: Joi.string().required().label('body: REALTIME_SERVER'),
  API_SERVER: Joi.string().required().label('body: API_SERVER')
})

export default function (eventChannel: Channel) {

  const router = new Router()

  router.get('/ping', ctx => ctx.body = 'pong')
  router.get('/pig', ctx => ctx.body = `oink`)

  router.get('/version', ctx => {
    ctx.status = 200
    ctx.body = {
      result: { version: 'beta' }
    }
  })

  router.use(JWTMiddleware)

  router.post('/session/start', jsonParser, validationFnForSchema(EnvSchema), ctx => {

    const env = ctx.state.body as Pick<SessionData, 'REALTIME_SERVER' | 'API_SERVER'>

    eventChannel.next({
      type: EventType.Session,
      payload: {
        token: ctx.state.token,
        REALTIME_SERVER: env.REALTIME_SERVER,
        API_SERVER: env.API_SERVER
      }
    })

    ctx.status = 200
  })

  router.post('/session/stop', ctx => {
    eventChannel.next({ type: EventType.Session, payload: null })
    ctx.status = 200
  })

  router.post('/new', ctx => {
    eventChannel.next({ type: EventType.NewProject })
    ctx.status = 200
  })

  return router
}
