
import * as React from 'react'
import { EOL } from 'os'
import { clipboard, shell } from 'electron'

import { getCreateSSLCommands, sslDir } from '../utils/ssl'
import { LocalImg } from './LocalImg'
import { getPlatform } from '../../platform'

export class SSLHelp extends React.PureComponent {

  copyToClipboard = (command: string) => () => {
      clipboard.writeText(command.replace(/\n/g, EOL))
  }

  openHomeFolder = () => shell.openItem(sslDir)

  renderOSXSetupInstructions = () => {
    return (
      <React.Fragment>
        <p>In order to get OSX to trust your generated certificate, you will have to import the generated rootCA.pem into `Keychain Assistant` and set it to trust for `Secure Sockets Layer`.</p>

        <p>Open the SSL Directory in Finder ( or click <a onClick={ () => this.openHomeFolder() }>here</a> )</p>
        <p>Double click on the `rootCA.pem` file. This should open up `Keychain Assistant` with a prompt requiring your authorization to added the selected key.</p>
        <p>Once the key has been added, right click on your newly added certificate in `Keychain Assistant`, and click `Get Info`</p>

        <LocalImg src="/keychain-prompt.png" />

        <p>Expand the `Trust` panel, and change the setting for `Secure Sockets Layer (SSL)` to `Always Trust`.</p>
        <p>Now restart your browser, and this app and you should be good to go!</p>
      </React.Fragment>
    )
  }

  renderWindowsSetupInstructions = () => {
    return (
      <React.Fragment>
        <p>Add the rootCA.pem found in the .localhost-ssl folder to Chrome by going to Settings &gt; Manage Certificates &gt; Select the Trusted Root Certification Authorities tab and click Import.
          Note that the .pem format is not available by default in the list of selectable formats, the file will need to be selected with All Files selected as the format in the file prompt.
          You will be asked if you want to use this certificate as a trusted Authority. Click Yes.</p>
      </React.Fragment>
    )
  }

  renderOtherSetupInstructions = () => {
    return (
      <React.Fragment>
        <p>Add certificate to chrome's local certificate key store. Go the chrome's settings page and search for SSL Certificates.</p>
        <div className="text-center"><LocalImg src="/chrome-ssl.png" /></div>
        <p>
          Once the certificate assistant is open for your platform, simply add the rootCA.pem and rootCA.key to your certificate store, ensure that it is set to trust for SSL and then restart your browser.
          Once that's done, you should have valid signed ssl certificates for your system. Once this has been set-up, simply restart this SDK to verify if everything has been set-up correctly.
        </p>
      </React.Fragment>
    )
  }

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
          The commands described below must be run in a unix terminal of choice. They are tailored to your system and once complete, will generate
          Root CA certificates and place them in the following folder { sslDir }.
        </p>

        <p>
          Simply copy them ( or use the copy button at the top right of every command box ) and paste them into a unix terminal. Some of these commands will prompt you for additional
          information before completing.
        </p>

        <h2 className="h2">Make SSL Directory</h2>
        <CommandSegment command={ makeDir } onClick={ this.copyToClipboard(makeDir) } />

        <h2 className="h2">Create Root CA</h2>
        { rootCACerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) } />) }

        <h2 className="h2">Create Self-Signed Cert</h2>
        { selfSignedCerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) } />) }

        <h2 className="h2">Trusting your self-signed cert</h2>

        { getPlatform() === 'osx' && this.renderOSXSetupInstructions() }
        { getPlatform() === 'win' && this.renderWindowsSetupInstructions() }
        { getPlatform() === 'unix' && this.renderOtherSetupInstructions() }
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
