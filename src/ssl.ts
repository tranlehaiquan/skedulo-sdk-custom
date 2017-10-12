
import * as fs from 'fs'

// Setup HTTPS Server
export const SSLOptions = {
  key: fs.readFileSync(process.env.HOME + '/.localhost-ssl/key.pem'),
  cert: fs.readFileSync(process.env.HOME + '/.localhost-ssl/cert.pem')
}
