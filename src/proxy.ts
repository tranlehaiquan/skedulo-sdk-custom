
import * as Rx from 'rxjs'
import * as https from 'https'
import * as httpProxy from 'http-proxy'

import { SSLOptions } from './ssl'

export interface Point {
  host?: string
  port: number
}

export function proxyTo(target: Point, source: Point): Rx.Observable<void> {

  return new Rx.Observable<void>(observer => {

    target.host = target.host || 'localhost'
    source.host = source.host || 'localhost'

    const proxy = httpProxy.createProxyServer({
      target: `http://${target.host || 'localhost'}:${target.port}`,
      ws: true
    })

    const proxyServer = https.createServer(SSLOptions, (req, res) => {
      // Add CORS header
      res.setHeader("Access-Control-Allow-Origin", '*')
      proxy.web(req, res)
    })

    proxyServer.on('upgrade', (request, socket, head) => proxy.ws(request, socket, head))
    proxyServer.listen(source.port, source.host || 'localhost')

    console.info(`Proxy Server started on https://${source.host}:${source.port}`)

    proxyServer.on('close', () => {
      console.info('Closing Proxy Server')
    })

    // Clean-up proxy server when disposed
    return () => {
      proxyServer.close()
      proxy.close()
    }
  })

}
