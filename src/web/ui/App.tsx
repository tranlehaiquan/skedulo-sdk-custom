import * as fs from 'fs'
import * as path from 'path'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { shell } from 'electron'
import { Subscription, Observable } from 'rxjs'

import { getPlatform, Platform } from '../../platform'
import { EventChannel } from '../service-layer/EventChannel'
import { MainServices } from '../service-layer/MainServices'
import { ProjectData, SessionData, UserMetadata } from '../service-layer/types'
import { setUpSSLDocLocation, sslCertsPresent } from '../utils/ssl'
import { ActiveProject } from './ActiveProject'
import { ContentLayout, HeaderLayout } from './Layout'
import { Markdown } from './Markdown'
import { NewConnectedPageProject } from './NewConnectedPageProject'
import { CreateNewPackage } from './CreateNewPackage'
import { NewCustomFormProject } from './NewCustomFormProject'
import { SelectProject } from './SelectProject'
import { SSLHelp } from './SSLHelp'
import { ManageCustomForms } from './ManageCustomForms'
import { debugDevStack } from '../utils/shell'
import { ProjectType } from '../service-layer/types'
import { SelectPackage } from './package/SelectPackage'

function openUrl(url: string) {
  shell.openExternal(url)
}

export enum View {
  Home,
  ManageConnectedPages,
  ManageCustomForms,
  ManagePackages,
  OpenPackage,
  SSLNotSetPrompt,
  SetupSSL,
  SetupSSLMarkdown,
  CreateCPProject,
  CreatePackage,
  SelectCPProject,
  ActiveCPProject,
  CreateCFProject,
  SelectCFProject,
  ActiveCFProject,
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
  connectionError: string | null
  userMetadata: UserMetadata | null,
  debug: {
    node: DebugState | null,
    yarn: DebugState | null,
    openssl: DebugState | null
  }
}

interface DebugState {
  valid: boolean,
  reason: string | null
  link: string | null
}

export class App extends React.Component<{}, IState> {

  state: IState = {
    currentView: View.Home,
    projectData: null,
    session: null,
    selectedProject: null,
    platform: getPlatform(),
    sslCertsPresent: sslCertsPresent(),
    userMetadata: null,
    connectionError: null,
    debug: {
      node: null,
      yarn: null,
      openssl: null
    }
  }

  private subscription = new Subscription()
  private eventChannel = new EventChannel()

  componentDidMount() {
    // We test for the presence of SSL certs and proceed if they're set up.
    // We don't verify the validity of the SSL certs at the moment.
    // We also rely on the user re-starting the app after setting up their SSL certs
    // correctly to keep things simple. We can automate that process down the line.
    if (!this.state.sslCertsPresent) {
      this.setState({ currentView: View.SSLNotSetPrompt })

      this.subscription.add(
        this.getDebugState().subscribe(void 0, error => console.error(error))
      )

    } else {

      const newProjSub = this.eventChannel.onNewProject()
        .do(() => this.setState({ currentView: View.CreateCPProject }))
        .do(() => MainServices.focus())

      this.subscription
        .add(
          Observable.merge(newProjSub, this.getDebugState(), this.maintainSession())
            .subscribe(void 0, error => console.error(error))
        )
    }
  }

  // Cleanup subscriptions when component unmounts
  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  back = (view?: View) => this.setState({ currentView: view ? view : View.Home, selectedProject: null, projectData: null, errorMessage: '' })
  setView = (currentView: IState['currentView']) => () => this.setState({ currentView })
  goHome = () => this.setView(this.state.sslCertsPresent ? View.Home : View.SSLNotSetPrompt)

  selectConnectedPageProject = (selectedProject: string) => {

    if (!fs.existsSync(path.join(selectedProject, '/sked.proj.json'))) {
      this.setState({
        errorMessage: 'The folder you have selected does not contain a valid Connected Pages project file. Please select another.'
      })
    } else {
      this.setState({
        currentView: View.ActiveCPProject,
        selectedProject,
        projectData: null,
        errorMessage: ''
      })
    }
  }

  selectCustomFormProject = (selectedProject: string) => {
    if (!fs.existsSync(path.join(selectedProject, '/definition.json'))) {
      this.setState({
        errorMessage: 'The folder you have selected does not contain a valid Custom Form project file. Please select another.'
      })
    } else {
      this.setState({
        currentView: View.ActiveCFProject,
        selectedProject,
        projectData: null,
        errorMessage: ''
      })
    }
  }

  getDebugState = () => {

    const { nodeExists, yarnExists, openSSLExists } = debugDevStack()
    const setter = (namespace: keyof IState['debug']) => (status: DebugState) => this.setState({ debug: { ...this.state.debug, [namespace]: status } })

    return Observable.merge(
      nodeExists.do(setter('node')),
      yarnExists.do(setter('yarn')),
      openSSLExists.do(setter('openssl'))
    )
  }

  maintainSession = () => {

    return this.eventChannel.onSessionEvent()
      .do(session => {

        if (session) {

          this.setState({ session })

          fetch(session.API_SERVER + '/custom/usermetadata', {
            headers: { Authorization: `Bearer ${session.token}` }
          })
            .then(response => {
              if (response.status === 200) {
                return response.json().then(res => res.result as UserMetadata)
              } else if (response.status >= 400) {
                return response.json().then(res => `Connection Error : ${res.errorType}: ${res.message}`).then(errMsg => Promise.reject(errMsg))
              } else {
                return Promise.reject('Could not connect to the server. Please try again later.')
              }
            })
            .then(userMetadata => this.setState({ userMetadata, connectionError: null }))
            .catch(connectionError => this.setState({ connectionError }))
        } else {
          this.setState({ session: null, connectionError: null, userMetadata: null, currentView: View.Home })
        }
      })
  }

  renderNotConnected = () => {

    const isConnecting = !!(this.state.session && !this.state.userMetadata)
    const connectionError = this.state.connectionError

    let message: string

    if (connectionError) {
      message = connectionError
    } else if (isConnecting) {
      message = 'Connecting ...'
    } else {
      message = 'To begin, enable "Developer Mode" from Connected Page settings in the Skedulo Web App'
    }

    return (
      <p>{ message }</p>
    )
  }

  renderHomeActionButtons = () => {
    return (
      <div>
        <p>To begin, select one of the following options.</p>
        <button className="sk-button primary" onClick={ this.setView(View.ManagePackages) }>Manage Package</button>
        <button className="sk-button secondary" onClick={ this.setView(View.ManageConnectedPages) }>Manage Connected Pages</button>
        <button className="sk-button secondary" onClick={ this.setView(View.ManageCustomForms) }>Manage Custom Forms</button>
      </div>
    )
  }

  renderPackageActionButtons = () => {
    return (
      <div>
        <p>Select an action to manage Packages.</p>
        <button className="sk-button secondary" onClick={ this.setView(View.CreatePackage) }>Create new package</button>
        <button className="sk-button primary" onClick={ this.setView(View.OpenPackage) }>Select existing package</button>
      </div>
    )
  }

  renderConnectedPageActionButtons = () => {
    return (
      <div>
        <p>Select an action to manage Connected Pages.</p>
        <button className="sk-button primary" onClick={ this.setView(View.CreateCPProject) }>Create new project</button>
        <button className="sk-button secondary" onClick={ this.setView(View.SelectCPProject) }>Select existing project</button>
      </div>
    )
  }

  renderCustomFormActionButtons = () => {
    return (
      <div>
        <p>Select an action to manage Custom Forms.</p>
        <button className="sk-button primary" onClick={ this.setView(View.CreateCFProject) }>Create new project</button>
        <button className="sk-button secondary" onClick={ this.setView(View.SelectCFProject) }>Select existing project</button>
        <button className="sk-button secondary" onClick={ this.setView(View.ManageLegacyCustomForm) }>Deploy an existing project</button>
      </div>
    )
  }

  renderHome = () => {

    const isConnected = !!(this.state.session && this.state.userMetadata)

    return (
      <ContentLayout className="content__center--large" centered>
        <h1>Welcome to Skedulo’s Connected Pages platform</h1>
        { isConnected ? this.renderHomeActionButtons() : this.renderNotConnected() }
        <DebugInstall { ...this.state.debug } />
      </ContentLayout>
    )
  }

  renderManagePackages = () => {
    return (
      <ContentLayout className="content__center--large" centered>
        <h1>Manage Packages</h1>
        { this.renderPackageActionButtons() }
      </ContentLayout>
    )
  }

  renderManageConnectedPages = () => {
    return (
      <ContentLayout className="content__center--large" centered>
        <h1>Manage Connected Pages</h1>
        { this.renderConnectedPageActionButtons() }
      </ContentLayout>
    )
  }

  renderManageCustomForms = () => {
    return (
      <ContentLayout className="content__center--large" centered>
        <h1>Manage Custom Forms</h1>
        { this.renderCustomFormActionButtons() }
      </ContentLayout>
    )
  }

  renderSSLHelpPrompt = () => {
    return (
      <ContentLayout centered>
        <h1>Welcome to Skedulo’s Connected Pages platform</h1>
        <p>
          You need to setup self-signed SSL certificates to continue. Click <a className="blue-link" onClick={ this.setView(View.SetupSSL) }>here</a>&nbsp; for instructions on how to do this.
        </p>
        <DebugInstall { ...this.state.debug } />
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

    const customFormBack = () => this.back(View.ManageCustomForms)
    const connectedPageBack = () => this.back(View.ManageConnectedPages)
    const managePackageBack = () => this.back(View.ManagePackages)

    switch (currentView) {
      case View.Home:
        return this.renderHome()
      case View.SSLNotSetPrompt:
        return this.renderSSLHelpPrompt()
      case View.SetupSSL:
        return this.renderSSLHelp()
      case View.SetupSSLMarkdown:
        return this.renderSSLHelpFromMarkdown()
      case View.ManageConnectedPages:
        return this.renderManageConnectedPages()
      case View.ManageCustomForms:
        return this.renderManageCustomForms()
      case View.ManagePackages:
        return this.renderManagePackages()
      case View.OpenPackage:
        return <SelectPackage back={ managePackageBack } session={ session! } />
      case View.SelectCPProject:
        return <SelectProject back={ connectedPageBack } selectProject={ this.selectConnectedPageProject } errorMessage={ errorMessage } />
      case View.ActiveCPProject:
        return <ActiveProject back={ connectedPageBack } projectType={ ProjectType.ConnectedPage } project={ selectedProject! } session={ session! } />
      case View.CreateCPProject:
        return <NewConnectedPageProject back={ connectedPageBack } selectProject={ this.selectConnectedPageProject } />
      case View.CreatePackage:
        return <CreateNewPackage back={ managePackageBack } session={ session! } />
      case View.SelectCFProject:
        return <SelectProject back={ customFormBack } selectProject={ this.selectCustomFormProject } errorMessage={ errorMessage } />
      case View.ActiveCFProject:
        return <ActiveProject back={ customFormBack } projectType={ ProjectType.CustomForm } project={ selectedProject! } session={ session! } />
      case View.CreateCFProject:
        return <NewCustomFormProject back={ customFormBack } selectProject={ this.selectCustomFormProject } />
      case View.ManageLegacyCustomForm:
        return <ManageCustomForms back={ customFormBack } session={ session! } />
    }

    return enumUnreachable(currentView)
  }

  render() {

    const child = this.renderView()

    return (
      <HeaderLayout key={ this.state.session ? this.state.session.token : '_default' } onHomeClick={ this.goHome() } userMetadata={ this.state.userMetadata }>
        { child }
      </HeaderLayout>
    )
  }
}

export class DebugInstall extends React.PureComponent<IState['debug']> {

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
      <div className="text-left padding-top">
        <h3>System Requirements</h3>
        <ul className="installation__steps">
          { this.renderItem('OpenSSL', this.props.openssl) }
          { this.renderItem('Yarn', this.props.yarn) }
          { this.renderItem('Node', this.props.node) }
        </ul>
      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
