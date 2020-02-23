
import * as React from 'react'
import { Observable, Subscription } from 'rxjs'
import { PackageService } from '../../service-layer/package/PackageService'
import { LibraryProjectService } from '../../service-layer/package/LibraryProjectService'
import { LogItem } from '../../utils/shell'
import { Terminal, TerminalSize } from '../Terminal'
import { Button, ButtonGroup } from '@skedulo/sked-ui'

interface Props {
  back?: () => void
  concurrentActiveProject: boolean
  projectService: LibraryProjectService
  packageService: PackageService
}

interface State {
  inProgress: boolean
  log$: Observable<LogItem> | null
}

export class ActiveLibraryProject extends React.PureComponent<Props, State> {
  state: State = {
    log$: null,
    inProgress: false
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
    const log$ = this.props.projectService.startDev()
      .finally(() => this.resetState())
      .publish()

    this.subscriptions.add(log$.connect())
    this.setState({ inProgress: true, log$ })
  }

  cancel = () => {
    this.subscriptions.unsubscribe()
    this.subscriptions = new Subscription()
  }

  resetState = () => this.setState({ inProgress: false })

  renderDevReady = () => {
    if (this.state.log$) {
      return 'Library build currently active...'
    } else {
      return 'Select "start development" to build your library in "watch" mode'
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
