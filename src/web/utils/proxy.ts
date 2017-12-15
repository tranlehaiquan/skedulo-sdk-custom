import * as httpProxy from 'http-proxy'
import * as https from 'https'
import * as Rx from 'rxjs'

import { getSSLOptions } from './ssl'

export interface Point {
  host?: string
  port: number
}

export function proxyTo(target: Point, source: Point): Rx.Observable<void> {

  return new Rx.Observable<void>(_ => {

    target.host = target.host || 'localhost'
    source.host = source.host || 'localhost'

    const proxy = httpProxy.createProxyServer({
      target: `http://${target.host}:${target.port}`,
      ws: true
    })

    const proxyServer = https.createServer(getSSLOptions(), (req, res) => {
      // Add CORS header to get all this to work
      res.setHeader('Access-Control-Allow-Origin', '*')
      proxy.web(req, res)
    })

    proxyServer.on('upgrade', (request, socket, head) => proxy.ws(request, socket, head))
    proxyServer.listen(source.port, source.host)

    // Clean-up proxy server when disposed
    return () => {
      proxyServer.close()
      proxy.close()
    }
  })
}
