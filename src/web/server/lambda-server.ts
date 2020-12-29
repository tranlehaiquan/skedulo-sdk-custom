import * as child_process from 'child_process'
import * as http from 'http'
import * as KCors from 'kcors'
import * as Koa from 'koa'
import * as bodyParser from 'koa-bodyparser'
import { pickBy } from 'lodash'
import * as path from 'path'
import { Observable } from 'rxjs'
import { LogItem } from '../utils/shell'
import { WEB_BASE_PATH } from '../web-base-path'
import { JWTMiddleware } from './middleware/jwt'

interface FnPayload {
  headers: {
    Authorization: string
    [key: string]: string | undefined
  },
  querystring: string | null
  method: string
  path: string
  body: JSON
}

interface ResponseType {
  type: 'response', data: { status: number, body: JSON }
}

type ChildMessage = { type: 'init' } | ResponseType | { type: 'error', data: any }

const SKED_HEADERS_PREFIX = 'sked-'

export function startLambdaServer(port: number, lambdaProjectPath: string, executionTimeout: number) {

  return new Observable<LogItem>(obs => {

    const app = new Koa()

    // Enable Cross Origin Requests
    app.use(KCors())
    app.use(JWTMiddleware)
    app.use(bodyParser({
      enableTypes: ['json'],
      jsonLimit: '6mb',
      strict: true
    }))

    app.use(async ctx => {

      const apiToken = ctx.state.token as string

      const fnPayload: FnPayload = {
        headers: {
          ...pickBy(ctx.req.headers, (_value, key) => key.toLowerCase().startsWith(SKED_HEADERS_PREFIX)),
          Authorization: `Bearer ${apiToken}`,
          'sked-api-server': ctx.req.headers['sked-api-server'] as string,
          'Content-Type': ctx.req.headers['content-type']
        },
        method: ctx.request.method,
        querystring: ctx.request.querystring,
        path: ctx.request.path,
        body: ctx.request.body
      }

      try {

        const { status, body } = await runRequest(lambdaProjectPath, fnPayload, executionTimeout, (item: LogItem) => obs.next(item))

        ctx.status = status

        if (body) {
          ctx.body = body
        }

      } catch (e) {
        ctx.status = 400
        ctx.body = e.message
      }
    })

    const server = http.createServer(app.callback()).listen(port, 'localhost')

    return () => {
      server.close()
    }
  })
}

function runRequest(projectPath: string, fnPayload: FnPayload, executionTimeout: number, logCallback: (item: LogItem) => void): Promise<ResponseType['data']> {
  return new Promise((resolve, reject) => {
    const child = child_process.fork(path.join(WEB_BASE_PATH, '/assets/lambda-dev-wrapper'), [], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    })

    if (!child) {
      return reject(new Error('Unable to fork new process to run request'))
    }

    child.stdout?.setEncoding('utf8')
    child.stderr?.setEncoding('utf8')

    let timer: NodeJS.Timer | null = setTimeout(() => {
      killChildProcess()
      reject(new Error('Execution timeout'))
    }, executionTimeout)

    const killChildProcess = () => {

      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      // Kill "child" process
      child?.kill()
    }

    // Start "streaming" logs out via callback
    child.stdout?.on('data', (out: string) => logCallback({ type: 'out', value: out }))
    child.stderr?.on('data', (out: string) => logCallback({ type: 'err', value: out }))

    child.on('message', msg => {

      const parsed = JSON.parse(msg) as ChildMessage

      switch (parsed.type) {
        case 'init':
          child.send(JSON.stringify({ type: 'request', data: fnPayload }))
          break
        case 'response':
          resolve(parsed.data)
          killChildProcess()
          break
        case 'error':
          reject()
          killChildProcess()
          break
        default: throw new Error('Unknown response received')
      }
    })
  })
}
