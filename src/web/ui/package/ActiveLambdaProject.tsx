
import * as React from 'react'
import { FunctionProjectService } from '../../service-layer/package/FunctionProjectService'
import { Observable, Subscription } from 'rxjs'
import { LogItem } from '../../utils/shell'
import { Terminal, TerminalSize } from '../Terminal'
import { MainServices } from '../../service-layer/MainServices'
import { PackageService } from '../../service-layer/package/PackageService'
import { Button, ButtonGroup } from '@skedulo/sked-ui'

interface Props {
  back?: () => void
  concurrentActiveProject: boolean
  projectService: FunctionProjectService
  packageService: PackageService
}

interface State {
  inProgress: boolean
  log$: Observable<LogItem> | null
  portNumber: number | null
}

export class ActiveLambdaProject extends React.PureComponent<Props, State> {

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

  startDev = async (inspect?: boolean) => {

    const portNumber = await MainServices.getPort()

    const log$ = this.props.projectService.startDev(portNumber, inspect)
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
      return (
        <React.Fragment>
          <p>Function exposed at: <br />
            <p>Local: <b>{ `http://localhost:${this.state.portNumber}` }</b></p>
            <p>Remote: <b>{ this.props.projectService.getRemoteDevUrl() }</b></p>
          </p>
        </React.Fragment>)
    } else {
      return 'Select "start development" to begin building your function'
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
              <Button buttonType="primary" onClick={ () => this.startDev() } disabled={ this.state.inProgress } >Start Development</Button>
              <Button buttonType="primary" onClick={ () => this.startDev(true) } disabled={ this.state.inProgress } >Start Debug</Button>
            </ButtonGroup>
          </div>
        </div>
        <hr />
        { this.state.log$ ? <Terminal size={ terminalSize } log$={ this.state.log$ } /> : null }
      </React.Fragment>
    )
  }
}
