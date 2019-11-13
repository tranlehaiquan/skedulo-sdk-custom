/**
 * This is the "entry point" of the Skedulo function.
 * This usually does not need to be changed. Start writing your function
 * by defining a route in the `routes.ts` file.
 */
import * as pathToRegExp from 'path-to-regexp'
import { FnPayload, Response } from './types'
import { getRoutes } from './routes'

const routes = getRoutes()

const compiledRoutes = routes.map(route => {

  const regex = pathToRegExp(route.path)

  return {
    regex,
    method: route.method,
    handler: route.handler
  }
})

export const handler = async (payload: FnPayload): Promise<Response> => {

  const start = Date.now()

  try {

    const { method, path, headers, body, querystring } = payload

    const matchedRoute = compiledRoutes
      .filter(route => route.method === method.toLowerCase())
      .find(route => !!route.regex.exec(path))

    if (matchedRoute) {
      return await matchedRoute.handler(body, headers, method, path, querystring)
    } else {
      return {
        status: 404
      }
    }
  } catch (e) {
    console.error(e)

    return {
      status: 400,
      body: {
        error: e.message
      }
    }
  } finally {
    console.info(`${payload.method}: ${payload.path}: ${Date.now() - start}ms`)
  }
}
