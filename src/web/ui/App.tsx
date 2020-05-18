import * as fs from 'fs'
import * as path from 'path'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button, ButtonGroup, IconButton, LoadingSpinner } from '@skedulo/sked-ui'
import { Subscription, Observable } from 'rxjs'
import { getPlatform, Platform } from '../../platform'
import { EventChannel } from '../service-layer/EventChannel'
import { MainServices } from '../service-layer/MainServices'
import { ProjectData, SessionData, UserMetadata } from '../service-layer/types'
import { setUpSSLDocLocation, sslCertsPresent } from '../utils/ssl'
import { PackageService } from '../service-layer/package/PackageService'
import { debugDevStack } from '../utils/shell'
import { enumUnreachable } from '../utils/types'
import { ActiveLegacyProject } from './legacy/ActiveLegacyProject'
import { NewConnectedPageProject } from './legacy/NewConnectedPageProject'
import { NewFunctionProject } from './package/NewFunctionProject'
import { NewWebPageProject } from './package/NewWebPageProject'
import { CreateNewPackage } from './package/CreateNewPackage'
import { ConfigurePackage } from './package/ConfigurePackage'
import { SelectProject } from './legacy/SelectProject'
import { SelectPackage } from './package/SelectPackage'
import { NewLibraryProject } from './package/NewLibraryProject'
import { DebugState, DebugInstall } from './DebugInstall'
import { NewMobilePageProject } from './package/NewMobilePageProject'
import { ContentLayout, HeaderLayout } from './Layout'
import { Markdown } from './Markdown'
import { SSLHelp } from './SSLHelp'


export enum View {
  // Setup Views
  Home,
  SSLNotSetPrompt,
  SetupSSL,
  SetupSSLMarkdown,
  Diagnostics,

  // Package Views
  ManagePackages,
  OpenPackage,
  CreateFunctionProject,
  CreateWebpageProject,
  CreateLibraryProject,
  CreateMobilePageProject,
  CreatePackage,
  ConfigurePackage,
  LoadingPackage,

  // Legacy Views (Standalone Web Extensions)
  LegacyManageConnectedPages,
  LegacyCreateCPProject,
  LegacySelectCPProject,
  LegacyActiveCPProject
}

export interface IState {
  currentView: View
  platform: Platform | null
  sslCertsPresent: boolean
  projectData: ProjectData | null
  selectedLegacyProject: string | null
  selectedPackage: PackageService | null
  session: SessionData | null
  errorMessage?: string
  connectionError: string | null
  userMetadata: UserMetadata | null
  environment: {
    node: DebugState | null
    yarn: DebugState | null
    openssl: DebugState | null
  }
}

const SKEDULO_WELCOME_MESSAGE = 'Welcome to Skedulo’s Packages platform'

export class App extends React.Component<{}, IState> {
  state: IState = {
    currentView: View.Home,
    projectData: null,
    session: null,
    selectedLegacyProject: null,
    platform: getPlatform(),
    sslCertsPresent: sslCertsPresent(),
    userMetadata: null,
    connectionError: null,
    selectedPackage: null,
    environment: {
      node: null,
      yarn: null,
      openssl: null
    }
  }

  private subscription = new Subscription()
  private eventChannel = new EventChannel()

  componentDidMount() {
    this.appInitialize()
  }

  // Cleanup subscriptions when component unmounts
  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  appInitialize() {
    // Test for existence of SSL certs, no checks on the certs are run currently.
    if (!this.state.sslCertsPresent) {
      this.setState({ currentView: View.SSLNotSetPrompt })

      this.subscription.add(
        this.checkDevelopmentEnvironment().subscribe(void 0, error => console.error(error))
      )
    } else {
      const onNewProject$ = this.eventChannel.onNewProject()
        .do(() => this.setState({ currentView: View.LegacyCreateCPProject }))
        .do(() => MainServices.focus())

      this.subscription
        .add(
          Observable
            .merge(onNewProject$, this.checkDevelopmentEnvironment(), this.listenForDevelopmentSession())
            .subscribe(void 0, error => console.error(error)) // emit on success, log errors.
        )
    }
  }

  back = (view?: View) => this.setState({
    currentView: view ? view : View.Home,
    selectedLegacyProject: null,
    projectData: null,
    errorMessage: ''
  })

  setView = (currentView: IState['currentView']) => () => this.setState({ currentView })

  refreshPackage = async (goToConfiguration: boolean, refreshLinks: boolean = false) => {
    const { selectedPackage, session, currentView: view } = this.state
    if (!selectedPackage) {
      return
    }
    
    try {
      // Re-evaluate package metadata
      const refreshedPackage = PackageService.at(selectedPackage.packagePath, session!)

      if (refreshLinks) {
        await refreshedPackage.load()
      }

      this.setState({
        currentView: goToConfiguration ? View.ConfigurePackage : view,
        selectedPackage: refreshedPackage
      })
    } catch(error) {
      MainServices.showErrorMessage('Package Error', error)

      this.setState({ currentView: View.ManagePackages })
    }
  }

  setPackage = async (pkgDirectory: string) => {
    try {
      await this.trySetPackage(pkgDirectory)
    } catch(error) {
      MainServices.showErrorMessage('Package Error', error)

      this.setState({ currentView: View.ManagePackages })
    }
  }

  trySetPackage = async (pkgDirectory: string) => {
    const { session } = this.state

    if (!pkgDirectory.length) {
      this.setState({
        selectedPackage: null
      })
    } else {
      const newPackage = PackageService.at(pkgDirectory, session!)

      this.setState({ currentView: View.LoadingPackage })

      // Load package (this can fail and it's not necessarily fatal, still allow user to view package)
      try {
        await newPackage.load()
      } catch (error) {
        MainServices.showErrorMessage(
          'Failed to load package.',
`Something went wrong when loading package.
This may be an environment issue and therefore is not fatal however \
some features of package development may not work as expected.  Error: ${error}`
        )
      }

      this.setState({
        selectedPackage: newPackage,
        currentView: View.ConfigurePackage
      })
    }
  }

  goHome = () => this.setView(
    this.state.sslCertsPresent
      ? View.Home
      : View.SSLNotSetPrompt
  )

  selectConnectedPageProject = (selectedProject: string) => {
    if (!fs.existsSync(path.join(selectedProject, '/sked.proj.json'))) {
      this.setState({
        errorMessage: 'The folder you have selected does not contain a valid Standalone Web Extensions project file. Please select another.'
      })
    } else {
      this.setState({
        currentView: View.LegacyActiveCPProject,
        selectedLegacyProject: selectedProject,
        projectData: null,
        errorMessage: ''
      })
    }
  }

  checkDevelopmentEnvironment = () => {
    const { nodeExists, yarnExists, openSSLExists } = debugDevStack()
    const setter = (namespace: keyof IState['environment']) => (status: DebugState) => this.setState({
      environment: {
        ...this.state.environment,
        [namespace]: status
      }
    })

    return Observable.merge(
      nodeExists.do(setter('node')),
      yarnExists.do(setter('yarn')),
      openSSLExists.do(setter('openssl'))
    )
  }

  listenForDevelopmentSession = () => {
    return this.eventChannel.onSessionEvent()
      .do(session => {
        if (session) {
          this.setState({ session })

          // We can now fetch metadata for this user, a
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
      message = 'To begin, enable "Developer Mode" from Extensions settings in the Skedulo Web App'
    }

    return (
      <p>{ message }</p>
    )
  }

  renderHomeActionButtons = () => {
    return (
      <div>
        <p>To begin, select one of the following options.</p>
        <ButtonGroup>
          <Button buttonType="primary" onClick={ this.setView(View.ManagePackages) }>Manage Package</Button>
          <Button buttonType="secondary" onClick={ this.setView(View.LegacyManageConnectedPages) }>Manage Standalone Web Extensions</Button>
        </ButtonGroup>
      </div>
    )
  }

  renderPackageActionButtons = () => {
    return (
      <div>
        <p>Select an action to manage Packages.</p>
        <ButtonGroup>
          <Button buttonType="primary" onClick={ this.setView(View.CreatePackage) }>Create new package</Button>
          <Button buttonType="secondary" onClick={ this.setView(View.OpenPackage) }>Select existing package</Button>
        </ButtonGroup>
      </div>
    )
  }

  renderConnectedPageActionButtons = () => {
    return (
      <div>
        <p>Select an action to manage Standalone Web Extensions.</p>
        <ButtonGroup>
          <Button buttonType="primary" onClick={ this.setView(View.LegacyCreateCPProject) }>Create new project</Button>
          <Button buttonType="secondary" onClick={ this.setView(View.LegacySelectCPProject) }>Select existing project</Button>
        </ButtonGroup>
      </div>
    )
  }

  renderDiagnostics = () => {
    return (
      <ContentLayout className="content__center--large" centered>
        <DebugInstall { ...this.state.environment } />
      </ContentLayout>
    )
  }

  renderHome = () => {
    const isConnected = !!(this.state.session && this.state.userMetadata)

    return (
      <>
        <ContentLayout className="content__center--large" centered>
          <h1>{ SKEDULO_WELCOME_MESSAGE }</h1>
          { isConnected ? this.renderHomeActionButtons() : this.renderNotConnected() } 
        </ContentLayout>

        <div className="diagnostics-button">
          <IconButton className="diagnostics-button" icon="settings" onClick={ this.setView(View.Diagnostics) } buttonType="secondary" tooltipContent="Diagnostics" />
        </div>
      </>
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
        <h1>Manage Standalone Web Extensions</h1>
        { this.renderConnectedPageActionButtons() }
      </ContentLayout>
    )
  }

  renderSSLHelpPrompt = () => {
    return (
      <ContentLayout centered>
        <h1>{ SKEDULO_WELCOME_MESSAGE }</h1>
        <p>
          You need to setup self-signed SSL certificates to continue. Click <a className="blue-link" onClick={ this.setView(View.SetupSSL) }>here</a>&nbsp; for instructions on how to do this.
        </p>
        <DebugInstall { ...this.state.environment } />
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

        <h1>{ SKEDULO_WELCOME_MESSAGE }</h1>

        <p>
          In order to run the Packages SDK, you will need to set up your dev environment with a self-signed SSL Certificate (must be X.509 v3) and
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
        <h1>{ SKEDULO_WELCOME_MESSAGE }</h1>
        <p>Unfortunately, We do not support your platform at this time. We only support <b>OSX</b> and <b>Windows</b></p>
      </ContentLayout>
    )
  }

  renderLoadingPackageView = () => {
    return (
      <ContentLayout centered>
        <LoadingSpinner size={ 50 } className="color-blue" />
        <p className="padding">Loading package...</p>
      </ContentLayout>
    )
  }

  // This is a "type-safe" enum pattern match function.
  // Pulled this from Lin's implementation in Frontend UI
  renderView = () => {
    const { setView, setPackage, refreshPackage, trySetPackage } = this
    const { selectedLegacyProject, errorMessage, platform, currentView, session, selectedPackage } = this.state

    if (!platform) {
      return this.renderUnsupportedPlatform()
    }

    const connectedPageBack = () => this.back(View.LegacyManageConnectedPages)
    const managePackageBack = () => this.back(View.ManagePackages)
    const manageProjectBack = () => this.back(View.ConfigurePackage)

    switch (currentView) {
      case View.Home:
        return this.renderHome()
      case View.SSLNotSetPrompt:
        return this.renderSSLHelpPrompt()
      case View.SetupSSL:
        return this.renderSSLHelp()
      case View.SetupSSLMarkdown:
        return this.renderSSLHelpFromMarkdown()
      case View.Diagnostics:
        return this.renderDiagnostics()
      case View.ManagePackages:
        return this.renderManagePackages()
      case View.LoadingPackage:
        return this.renderLoadingPackageView()
      case View.OpenPackage:
        // Select Package is capable of handling package errors, give it the unsafe variant
        return <SelectPackage back={ managePackageBack } session={ session! } setPackage={ trySetPackage } />
      case View.CreatePackage:
        return <CreateNewPackage back={ managePackageBack } session={ session! } setPackage={ setPackage } />
      case View.ConfigurePackage:
        return <ConfigurePackage package={ selectedPackage! } refreshPackage={ refreshPackage } setView={ setView } />
      case View.CreateFunctionProject:
        return <NewFunctionProject back={ manageProjectBack } selectedPackage={ selectedPackage! } refreshPackage={ refreshPackage } />
      case View.CreateWebpageProject:
        return <NewWebPageProject back={ manageProjectBack } selectedPackage={ selectedPackage! } refreshPackage={ refreshPackage } />
      case View.CreateLibraryProject:
        return <NewLibraryProject back={ manageProjectBack } selectedPackage={ selectedPackage! } refreshPackage={ refreshPackage } />
      case View.CreateMobilePageProject:
        return <NewMobilePageProject back={ manageProjectBack } selectedPackage={ selectedPackage! } refreshPackage={ refreshPackage } />
      
      // Legacy Pages
      case View.LegacyManageConnectedPages:
        return this.renderManageConnectedPages()
      case View.LegacySelectCPProject:
        return <SelectProject back={ connectedPageBack } selectProject={ this.selectConnectedPageProject } errorMessage={ errorMessage } />
      case View.LegacyActiveCPProject:
        return <ActiveLegacyProject back={ connectedPageBack } project={ selectedLegacyProject! } session={ session! } />
      case View.LegacyCreateCPProject:
        return <NewConnectedPageProject back={ connectedPageBack } selectProject={ this.selectConnectedPageProject } />
    }

    return enumUnreachable(currentView)
  }

  render() {
    const child = this.renderView()

    return (
      <HeaderLayout
        key={ this.state.session ? this.state.session.token : '_default' }
        onHomeClick={ this.goHome() }
        userMetadata={ this.state.userMetadata }
      >
        { child }
      </HeaderLayout>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('root'))
