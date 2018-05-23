import * as _ from 'lodash'
import * as React from 'react'
import { Observable, Subscription } from 'rxjs'

import { LogItem, ProjectServices } from '../service-layer/ProjectServices'
import { ProjectData, SessionData } from '../service-layer/types'
import { ContentLayout } from './Layout'
import { Terminal } from './Terminal'
import { shell } from 'electron'

function openUrl(url: string) {
  shell.openExternal(url)
}

export interface IProps {
  project: string
  back: () => void
  session: SessionData
}

export interface IState {
  log$: Observable<LogItem> | null
  inProgress: boolean
  devReady: boolean
  projectData: ProjectData | null
}

export class ActiveProject extends React.PureComponent<IProps, IState> {

  private prjServices = new ProjectServices(this.props.project, this.props.session)
  private subscriptions = new Subscription()

  state: IState = {
    log$: null,
    inProgress: false,
    devReady: false,
    projectData: this.prjServices.getProjectData()
  }

  componentWillUnmount() {
    this.cancel()
  }

  resetState = () => this.setState({ inProgress: false, devReady: false })

  cancel = () => {
    this.subscriptions.unsubscribe()
    this.subscriptions = new Subscription()

    // Reset state to default
    this.resetState()
  }

  startDev = () => {
    this.handleCommand(this.prjServices.startDev())
    this.setState({ devReady: true })
  }

  handleCommand = (sourceLog$: Observable<LogItem>) => {

    // Create a connectable HOT "Observable" that's shared to its children
    const log$ = sourceLog$
      .do(_.noop, _.noop, this.resetState)
      .publish()

    this.setState({
      log$,
      inProgress: true
    })

    this.subscriptions.add(log$.connect())

    return log$
  }

  startDeploy = () => {

    this.setState({ inProgress: true })

    return this.handleCommand(this.prjServices.startBuild())
      .toPromise()
      .then(() => this.setState({ inProgress: true }))
      .then(() => this.prjServices.startDeploy())
      .then(this.resetState, err => {
        console.error(err)
        this.resetState()
      })
  }

  renderDevReady = () => {

    const { devReady, inProgress } = this.state

    let message: React.ReactFragment

    if (!devReady && inProgress) {
      message = 'Preparing ...'
    } else if (devReady) {
      const url = this.props.session.origin + '/c-dev'
      message = <React.Fragment><p>Navigate to the following link to view the page <br /><a className="blue-link" onClick={ () => openUrl(url) }>{ url }</a></p></React.Fragment>
    } else {
      message = 'Select "start development" to begin building your connected page'
    }

    return message
  }

  render() {

    const { projectData } = this.state

    return (
      <ContentLayout>
        <div className="flex-row new-project">
          <button className="sk-button-icon transparent" onClick={ this.props.back }><i className="ski ski-arrow-left" /></button>
          <div className="new-project-title">{ projectData!.title }</div>
          <div className="flex-expanded-cell">{ this.renderDevReady() }</div>
          <div>
            { this.state.inProgress
              ? <button className="sk-button primary" onClick={ this.cancel }>Cancel</button>
              : null
            }
            <button className="sk-button primary" onClick={ this.startDev } disabled={ this.state.inProgress } >Start Development</button>
            <button className="sk-button primary" onClick={ this.startDeploy } disabled={ this.state.inProgress }>Deploy</button>
          </div>
        </div>
        <hr />
        { this.state.log$ ? <Terminal log$={ this.state.log$ } /> : null }
      </ContentLayout>
    )
  }
}
