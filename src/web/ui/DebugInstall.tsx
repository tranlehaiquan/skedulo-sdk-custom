import * as React from 'react'
import { shell } from 'electron'

function openUrl(url: string) {
  shell.openExternal(url)
}

export interface IProps {
  node: DebugState | null
  yarn: DebugState | null
  openssl: DebugState | null
}

export interface DebugState {
  valid: boolean,
  reason: string | null
  link: string | null
}

export class DebugInstall extends React.PureComponent<IProps> {

  renderItem = (key: string, item: DebugState | null) => {
    if (!item) {
      return <li><i className="icon sk-loader-small" />{ key }</li>
    }

    if (item.valid) {
      return <li><i className="icon color-green ski ski-tick" />{ key }</li>
    } else {
      return <li><i className="icon color-red ski ski-remove" />{ key } { item.reason }. { item.link && <span><br /><a className="blue-link" onClick={ () => openUrl(item.link!) }>Install Now</a></span> }</li>
    }
  }

  render() {
    return (
      <div className="text-left padding-top installation__container">
        <h2 className="h2">System Requirements</h2>
        <ul className="installation__steps">
          { this.renderItem('OpenSSL', this.props.openssl) }
          { this.renderItem('Yarn', this.props.yarn) }
          { this.renderItem('Node', this.props.node) }
        </ul>
      </div>
    )
  }
}