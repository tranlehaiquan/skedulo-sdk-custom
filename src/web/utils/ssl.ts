import * as fs from 'fs'
import { homedir } from 'os'
import * as path from 'path'

import { getPlatform } from '../../platform'
import { WEB_BASE_PATH } from '../web-base-path'

export const sslDir = path.join(homedir(), '/.localhost-ssl/')

export const setUpSSLDocLocation = path.resolve(WEB_BASE_PATH, './Setup-SSL.md')

const key = path.join(sslDir, 'server.key')
const cert = path.join(sslDir, 'server.crt')

export function sslCertsPresent() {
  return (fs.existsSync(key) && fs.existsSync(cert))
}

export function getSSLOptions() {
  return {
    key: fs.readFileSync(key!),
    cert: fs.readFileSync(cert!)
  }
}

export function getCreateSSLCommands() {

  const platform = getPlatform()

  switch (platform) {
    case 'osx':
    case 'unix':
      return getUnixCreateSSLCommands()
    case 'win':
      return getWindowsCreateSSLCommands()
    default:
      throw new Error('Unsupported Operating System')
  }
}

function getUnixCreateSSLCommands(destDir: string = sslDir) {

  const rootCAKeyPath = path.join(destDir, '/rootCA.key')
  const rootCACertPath = path.join(destDir, '/rootCA.pem')
  const csrPath = path.join(destDir, '/server.csr')
  const keyPath = path.join(destDir, '/server.key')
  const certPath = path.join(destDir, '/server.crt')

  const makeDir = `mkdir ${destDir}`
  const createRootCAKey = `openssl genrsa -des3 -out ${rootCAKeyPath} 2048`
  const createRootCACert = `openssl req -x509 -new -nodes -key ${rootCAKeyPath} -sha256 -days 1024 -out ${rootCACertPath}`

  const createSelfSignedCert1 = `openssl req -new -sha256 -nodes -out ${csrPath} -newkey rsa:2048 -keyout ${keyPath} -config <( cat <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C=US
ST=New York
L=Rochester
O=End Point
OU=Testing Domain
emailAddress=admin@myemail.com
CN = localhost
EOF
)`

  const createSelfSignedCert2 = `openssl x509 -req -in ${csrPath} -CA ${rootCACertPath} -CAkey ${rootCAKeyPath} -CAcreateserial -out ${certPath} -days 500 -sha256 -extfile <( cat <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
EOF
)`

  const rootCACerts = [
    createRootCAKey,
    createRootCACert
  ]

  const selfSignedCerts = [
    createSelfSignedCert1,
    createSelfSignedCert2
  ]

  return {
    makeDir,
    rootCACerts,
    selfSignedCerts
  }
}

function getWindowsCreateSSLCommands(destDir: string = sslDir) {

  const rootCAKeyPath = path.join(destDir, '/rootCA.key')
  const rootCACertPath = path.join(destDir, '/rootCA.pem')
  const csrPath = path.join(destDir, '/server.csr')
  const keyPath = path.join(destDir, '/server.key')
  const certPath = path.join(destDir, '/server.crt')
  const configPath = path.join(destDir, '/config.cnf')
  const v3Path = path.join(destDir, '/v3.ext')

  const makeDir = `mkdir ${destDir}`
  const createRootCAKey = `openssl genrsa -des3 -out ${rootCAKeyPath} 2048`
  const createRootCACert = `openssl req -x509 -new -nodes -key ${rootCAKeyPath} -sha256 -days 1024 -out ${rootCACertPath}`

  const createSelfSignedConfig = `(
echo [req]
echo default_bits = 2048
echo prompt = no
echo default_md = sha256
echo distinguished_name = dn
echo.
echo [dn]
echo C=US
echo ST=New York
echo L=Rochester
echo O=End Point
echo OU=Testing Domain
echo emailAddress=admin@myemail.com
echo CN = localhost
) > ${configPath}`

  const createV3 = `(
echo authorityKeyIdentifier=keyid,issuer
echo basicConstraints=CA:FALSE
echo keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
echo subjectAltName = @alt_names
echo.
echo [alt_names]
echo DNS.1 = localhost
) > ${v3Path}`

  const createSelfSignedCert1 = `openssl req -new -sha256 -nodes -out ${csrPath} -newkey rsa:2048 -keyout ${keyPath} -config ${configPath}`

  const createSelfSignedCert2 = `openssl x509 -req -in ${csrPath} -CA ${rootCACertPath} -CAkey ${rootCAKeyPath} -CAcreateserial -out ${certPath} -days 500 -sha256 -extfile ${v3Path}`

  const rootCACerts = [
    createRootCAKey,
    createRootCACert
  ]

  const selfSignedCerts = [
    createSelfSignedConfig,
    createV3,
    createSelfSignedCert1,
    createSelfSignedCert2
  ]

  return {
    makeDir,
    rootCACerts,
    selfSignedCerts
  }
}
