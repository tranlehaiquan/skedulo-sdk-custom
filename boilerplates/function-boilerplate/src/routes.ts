
/**
 * Describe the entry-point into the "skedulo-function" by updating the
 * array returned by the `getRoutes` method with additional routes
 */
import * as _ from 'lodash'
import { RouteIterface } from './types'

// tslint:disable-next-line:no-empty-interface
interface RequestPayload {
  // Describe type of "input"
}

export function getRoutes(): RouteIterface[] {

  return [
    {
      method: 'get',
      path: '/ping',
      handler: async (__, headers) => {

        const apiToken = headers.Authorization.split('Bearer')[1].trim()
        const apiServer = headers['sked-api-server']

        return {
          status: 200,
          body: { result: 'pong', apiServer, apiToken }
        }
      }
    },
    {
      method: 'post',
      path: '/action',
      handler: async (body: RequestPayload[], headers) => {

        const apiToken = headers.Authorization.split('Bearer')[1].trim()
        const apiServer = headers['sked-api-server']

        return {
          status: 200,
          body: { apiToken, apiServer, requestBody: body }
        }
      }
    }
  ]
}
