import * as Router from 'koa-router'
import { decode } from '../../utils/auth'

// This verifies the client secret
// as well as the audience parameter
export async function JWTMiddleware(ctx: Router.IRouterContext, next: () => Promise<any>) {

  if (!ctx.header || !ctx.header.authorization) {
    ctx.throw(401, 'Authorization header not found')
    return
  }

  const parts = ctx.header.authorization.split(' ')

  const scheme = parts[0]
  const token = parts[1]

  if (parts.length !== 2 || !/^Bearer$/i.test(scheme)) {
    ctx.throw(401, 'Invalid Authorization header format. Format is "Authorization: Bearer <token>"')
  } else {

    try {
      const decodedToken = await decode(token)

      ctx.state.user = decodedToken
      ctx.state.token = token

      return next()

    } catch (e) {
      console.error(e)
      ctx.throw(401, 'Invalid Authorization token or the token has expired')
    }
  }
}
