import * as React from 'react'
import { getCreateSSLCommands } from '../utils/ssl'
import { clipboard } from 'electron'

export class SSLHelp extends React.PureComponent {

  copyToClipboard = (command: string) => () => {
    clipboard.writeText(command)
  }

  render() {

    const { makeDir, rootCACerts, selfSignedCerts } = getCreateSSLCommands()

    return (
      <div>
        <p>Make SSL Directory</p>
        <CommandSegment command={ makeDir } onClick={ this.copyToClipboard(makeDir) }/>
        <p>Create Root CA</p>
        { rootCACerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) }/>) }
        <p>Create Self Signed Cert</p>
        { selfSignedCerts.map((command, index) => <CommandSegment key={ index } command={ command } onClick={ this.copyToClipboard(command) } />) }
        <p>Add SSL Certs to Keychain / Certificate Store</p>
        <CommandSegment command="Screenshots / more instructions here ..." />
      </div>
    )
  }
}

function CommandSegment(props: { command: string, onClick?: () => void }) {
  return (
    <pre className="small-12 column terminal">
      { props.command }
      { props.onClick &&
       <button onClick={ props.onClick }>Copy</button>
      }
    </pre>
  )
}
