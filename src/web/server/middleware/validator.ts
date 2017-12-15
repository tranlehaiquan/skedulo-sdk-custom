
import * as Joi from 'joi'
import * as Router from 'koa-router'

export function validationFnForSchema(schema: Joi.Schema) {

  return async (ctx: Router.IRouterContext, next: () => Promise<any>) => {

    const data = ctx.request.body

    const { error, value } = Joi.validate(data, schema, {
      abortEarly: false
    })

    if (error) {
      ctx.throw(400, { errors: error.details.map(e => e.message) })
    } else {
      ctx.state.body = value
      await next()
    }
  }
}
