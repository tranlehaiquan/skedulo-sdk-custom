
import * as React from 'react'
import { shell } from 'electron'
import { Observable, Subscription } from 'rxjs'
import { MainServices } from '../../service-layer/MainServices'
import { PackageService } from '../../service-layer/package/PackageService'
import { WebPageProjectService } from '../../service-layer/package/WebPageProjectService'
import { LogItem } from '../../utils/shell'
import { Terminal, TerminalSize } from '../Terminal'
import { Button, ButtonGroup } from '@skedulo/sked-ui'

interface Props {
  back?: () => void
  concurrentActiveProject: boolean
  projectService: WebPageProjectService
  packageService: PackageService
}

interface State {
  inProgress: boolean
  log$: Observable<LogItem> | null
  portNumber: number | null
}

function openUrl(url: string) {
  shell.openExternal(url)
}

export class ActiveWebPageProject extends React.PureComponent<Props, State> {

  state: State = {
    inProgress: false,
    log$: null,
    portNumber: null
  }

  private subscriptions = new Subscription()

  componentWillUnmount() {
    this.cancel()
  }

  bootstrap = () => {
    const log$ = this.props.projectService.bootstrap()
      .concat(Observable.of({ type: 'out', value: 'Bootstrap completed' } as LogItem))
      .finally(() => this.resetState())
      .publish()

    this.subscriptions.add(log$.connect())
    this.setState({ inProgress: true, log$ })
  }

  startDev = async () => {
    const portNumber = await MainServices.getPort()

    const log$ = this.props.projectService.startDev(portNumber)
      .finally(() => this.resetState())
      .publish()

    this.subscriptions.add(log$.connect())
    this.setState({ inProgress: true, log$, portNumber })
  }

  cancel = () => {
    this.subscriptions.unsubscribe()
    this.subscriptions = new Subscription()
  }

  resetState = () => this.setState({ inProgress: false, portNumber: null })

  renderDevReady = () => {
    if (this.state.portNumber) {
      const url = this.props.projectService.getDevUrl()
      return <React.Fragment><p>Navigate to the following link to view the page <br /><a className="blue-link" onClick={ () => openUrl(url) }>{ url }</a></p></React.Fragment>
    } else {
      return 'Select "start development" to begin building your web extension'
    }
  }

  render() {
    const terminalSize = this.props.concurrentActiveProject ? TerminalSize.HalfViewHeight : TerminalSize.FullViewHeight

    return (
      <React.Fragment>
        <div className="flex-row new-project clear">
          { !!this.props.back &&  <Button buttonType="transparent" onClick={ this.props.back }><i className="ski ski-arrow-left" /></Button> }
          <div className="new-project-title">{ this.props.projectService.project.name }</div>
          <div className="flex-expanded-cell">{ this.renderDevReady() }</div>
          <div>
            <ButtonGroup>
              { this.state.inProgress
                ? <Button buttonType="primary" onClick={ this.cancel }>Cancel</Button>
                : null
              }
              <Button buttonType="secondary" onClick={ this.bootstrap } disabled={ this.state.inProgress } >Bootstrap</Button>
              <Button buttonType="primary" onClick={ this.startDev } disabled={ this.state.inProgress } >Start Development</Button>
            </ButtonGroup>
          </div>
        </div>
        <hr />
        { this.state.log$ ? <Terminal size={ terminalSize } log$={ this.state.log$ } /> : null }
      </React.Fragment>
    )
  }
}
