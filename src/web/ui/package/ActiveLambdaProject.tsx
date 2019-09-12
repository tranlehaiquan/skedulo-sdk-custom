
import * as React from 'react'
import { FunctionProjectService } from '../../service-layer/package/FunctionProjectService'
import { Observable, Subscription } from 'rxjs'
import { LogItem } from '../../utils/shell'
import { Terminal, TerminalSize } from '../Terminal'
import { MainServices } from '../../service-layer/MainServices'
import { PackageService } from '../../service-layer/package/PackageService'

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
    const { packageService, projectService } = this.props

    if (packageService.packageProjectRequiresLink(projectService)) {
      try {
        packageService.createPackageLinksForProject(projectService)
      } catch (err) {
        // To ensure that the error makes it to the mock terminal, create stream of just the error event, once consumed the session status will be reset
        const errorLog$ = Observable.of({ type: 'err', value: `Failed to linked necessary projects: ${err.message}` } as LogItem)
          .finally(() => this.resetState())

        this.subscriptions.add(errorLog$.subscribe())
        this.setState({ inProgress: true, log$: errorLog$ })

        return
      }
    }

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
      return (
        <React.Fragment>
          <p>Function exposed at: <br />
            Local: <a className="blue-link">{ `http://localhost:${this.state.portNumber}` }</a><br />
            Remote: <a className="blue-link">{ this.props.projectService.getRemoteDevUrl() }</a>
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
          { !!this.props.back &&  <button className="sk-button-icon transparent" onClick={ this.props.back }><i className="ski ski-arrow-left" /></button> }
          <div className="new-project-title">{ this.props.projectService.project.name }</div>
          <div className="flex-expanded-cell">{ this.renderDevReady() }</div>
          <div>
            { this.state.inProgress
              ? <button className="sk-button primary" onClick={ this.cancel }>Cancel</button>
              : null
            }
            <button className="sk-button primary" onClick={ this.bootstrap } disabled={ this.state.inProgress } >Bootstrap</button>
            <button className="sk-button primary" onClick={ this.startDev } disabled={ this.state.inProgress } >Start Development</button>
          </div>
        </div>
        <hr />
        { this.state.log$ ? <Terminal size={ terminalSize } log$={ this.state.log$ } /> : null }
      </React.Fragment>
    )
  }
}
