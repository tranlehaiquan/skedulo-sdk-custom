import * as fs from 'fs'
import * as path from 'path'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Subscription } from 'rxjs'

import { getPlatform, Platform } from '../../platform'
import { EventChannel } from '../service-layer/EventChannel'
import { MainServices } from '../service-layer/MainServices'
import { ProjectData, SessionData } from '../service-layer/types'
import { setUpSSLDocLocation, sslCertsPresent } from '../utils/ssl'
import { ActiveProject } from './ActiveProject'
import { ContentLayout, HeaderLayout } from './Layout'
import { Markdown } from './Markdown'
import { NewProject } from './NewProject'
import { SelectProject } from './SelectProject'
import { SSLHelp } from './SSLHelp'
import { ManageCustomForms } from './ManageCustomForms'

export enum View {
  Home,
  SSLNotSetPrompt,
  SetupSSL,
  SetupSSLMarkdown,
  CreateProject,
  SelectProject,
  ActiveProject,
  ManageLegacyCustomForm
}

function enumUnreachable(_x: never): never {
  throw new Error('This will never throw since it would cause a type-check error during the compile step')
}

export interface IState {
  currentView: View
  platform: Platform | null
  sslCertsPresent: boolean
  projectData: ProjectData | null
  selectedProject: string | null
  session: SessionData | null
  errorMessage?: string
}

export class App extends React.PureComponent<{}, IState> {

  state: IState = {
    currentView: View.Home,
    projectData: null,
    session: null,
    selectedProject: null,
    platform: getPlatform(),
    sslCertsPresent: sslCertsPresent()
  }

  private subscription = new Subscription()
  private eventChannel?: EventChannel

  componentDidMount() {
    // We test for the presence of SSL certs and proceed if they're set up.
    // We don't verify the validity of the SSL certs at the moment.
    // We also rely on the user re-starting the app after setting up their SSL certs
    // correctly to keep things simple. We can automate that process down the line.
    if (!this.state.sslCertsPresent) {
      this.setState({ currentView: View.SSLNotSetPrompt })
    } else {

      this.eventChannel = new EventChannel()

      const newProjSub = this.eventChannel.onNewProject()
        .do(() => this.setState({ currentView: View.CreateProject }))
        .do(() => MainServices.focus())
        .subscribe(void 0, error => console.error(error))

      const sessionSub = this.eventChannel.onSessionEvent()
        .do(session => this.setState({ session }))
        .subscribe(void 0, error => console.error(error))

      this.subscription.add(newProjSub).add(sessionSub)
    }
  }

  // Cleanup subscriptions when component unmounts
  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  back = () => this.setState({ currentView: View.Home, selectedProject: null, projectData: null, errorMessage: '' })
  setView = (currentView: IState['currentView']) => () => this.setState({ currentView })
  goHome = () => this.setView(this.state.sslCertsPresent ? View.Home : View.SSLNotSetPrompt)

  selectProject = (selectedProject: string) => {

    if (!fs.existsSync(path.join(selectedProject, '/sked.proj.json'))) {
      this.setState({
        errorMessage: 'The folder you have selected does not contain a valid Connected Pages project file. Please select another.'
      })
    } else {
      this.setState({
        currentView: View.ActiveProject,
        selectedProject,
        projectData: null,
        errorMessage: ''
      })
    }
  }

  renderNotConnected = () => {
    return (
      <p>To begin, enable "Developer Mode" from Connected Page settings in Skedulo Web App.</p>
    )
  }

  renderActionButtons = () => {
    return (
      <div>
        <p>To begin, select one of the following options.</p>
        <button className="sk-button primary" onClick={ this.setView(View.CreateProject) }>Create new project</button>
        <button className="sk-button secondary" onClick={ this.setView(View.SelectProject) }>Select existing project</button>
        <button className="sk-button secondary" onClick={ this.setView(View.ManageLegacyCustomForm) }>Deploy Custom Forms</button>
      </div>
    )
  }

  renderHome = () => {

    const isConnected = !!this.state.session

    return (
      <ContentLayout centered>
        <h1>Welcome to Skedulo’s Connected Pages platform</h1>
        { isConnected ? this.renderActionButtons() : this.renderNotConnected() }
      </ContentLayout>
    )
  }

  renderSSLHelpPrompt = () => {
    return (
      <ContentLayout centered>
        <h1>Welcome to Skedulo’s Connected Pages platform</h1>
        <p>You need to setup SSL certificates to continue. Click <a onClick={ this.setView(View.SetupSSL) }>here</a>&nbsp;
          for instructions on how to do this for your platform or click <a onClick={ this.setView(View.SetupSSLMarkdown) }>here</a>&nbsp;
          to read documentation related to SSL. </p>
      </ContentLayout>
    )
  }

  renderSSLHelp = () => {
    return (
      <ContentLayout>
        <SSLHelp />
      </ContentLayout>
    )
  }

  renderSSLHelpFromMarkdown = () => {
    return (
      <ContentLayout>

        <h1>Welcome to Skedulo’s Connected Pages platform</h1>

        <p>
          In order to run the Connected Pages SDK, you will need to set up your dev environment with a self-signed SSL Certificate (must be X.509 v3) and
          follow a few steps to allow your Chrome browser to trust it. This is due to service workers requiring a trusted certificate to work correctly which
          are used during the development of your app.
        </p>

        <Markdown fileLocation={ setUpSSLDocLocation } />

      </ContentLayout>
    )
  }

  renderUnsupportedPlatform = () => {
    return (
      <ContentLayout>
        <h1>Welcome to Skedulo’s Connected Pages platform</h1>
        <p>Unfortunately, We do not support your platform at this time. We only support <b>OSX</b> and <b>Windows</b></p>
      </ContentLayout>
    )
  }

  // This is a "type-safe" enum pattern match function.
  // Pulled this from Lin's implementation in Frontend UI
  renderView = () => {

    const { selectedProject, errorMessage, platform, currentView, session } = this.state

    if (!platform) {
      return this.renderUnsupportedPlatform()
    }

    switch (currentView) {
      case View.Home:
        return this.renderHome()
      case View.SSLNotSetPrompt:
        return this.renderSSLHelpPrompt()
      case View.SetupSSL:
        return this.renderSSLHelp()
      case View.SetupSSLMarkdown:
        return this.renderSSLHelpFromMarkdown()
      case View.SelectProject:
        return <SelectProject back={ this.back } selectProject={ this.selectProject } errorMessage={ errorMessage } />
      case View.ActiveProject:
        return <ActiveProject back={ this.back } project={ selectedProject! } session={ session! } />
      case View.CreateProject:
        return <NewProject back={ this.back } selectProject={ this.selectProject } />
      case View.ManageLegacyCustomForm:
        return <ManageCustomForms back={ this.back } session={ session! } />
    }

    return enumUnreachable(currentView)
  }

  render() {

    const child = this.renderView()

    return (
      <HeaderLayout onHomeClick={ this.goHome() } key={ this.state.session ? this.state.session.token : '_default' }>
        { child }
      </HeaderLayout>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
