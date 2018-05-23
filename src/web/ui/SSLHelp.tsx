
import * as React from 'react'
import { clipboard } from 'electron'

import { getCreateSSLCommands, sslDir } from '../utils/ssl'
import { LocalImg } from './LocalImg'

export class SSLHelp extends React.PureComponent {

  copyToClipboard = (command: string) => () => clipboard.writeText(command)

  render() {

    const { makeDir, rootCACerts, selfSignedCerts } = getCreateSSLCommands()

    return (
      <div>
        <h1>Self-signed certificates</h1>

        <p>
          In order for the SDK to connect to an instance of the Skedulo Web app, you will need to setup a valid self-signed certificate in your
          system in a `.localhost-ssl` folder in your user system home folder : { sslDir }
        </p>

        <p>
          The commands described below must be run in a unix terminal of choice. They are tailoured to your system and once complete, will generate
          Root CA certificates and place them in the following folder { sslDir }.
        </p>

        <p>
          Simply copy them ( or use the copy button at the top right of every command box ) and paste them into a unix terminal. Some of these commands will prompt you for additional
          information before completing.
        </p>

        <h2>Make SSL Directory</h2>
        <CommandSegment command={ makeDir } onClick={ this.copyToClipboard(makeDir) } />

        <h2>Create Root CA</h2>
        { rootCACerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) } />) }

        <h2>Create Self Signed Cert</h2>
        { selfSignedCerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) } />) }

        <h2>Add SSL Certs to Keychain / Certificate Store</h2>
        <p>Add certificate to chrome's local certificate key store. Go the chrome's settings page and search for SSL Certificates.</p>
        <div className="text-center"><LocalImg src="/chrome-ssl.png" /></div>

        <p>
          Once the certificate assistant is open for your platform, simply add the rootCA.pem and rootCA.key to your certificate store and then restart your browser.
          Once that's done, you should have valid signed ssl certificates for your system. Once this has been set-up, simply restart this SDK to verify if everything has been set-up correctly.
        </p>

      </div>
    )
  }
}

function CommandSegment(props: { command: string, onClick?: () => void }) {
  return (
    <pre className="small-12 column terminal">
      { props.command }
      { props.onClick && <button onClick={ props.onClick }>Copy</button> }
    </pre>
  )
}
