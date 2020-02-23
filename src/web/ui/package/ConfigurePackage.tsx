import * as React from 'react'
import * as _ from 'lodash'

import { Button, ButtonGroup } from '@skedulo/sked-ui'
import { FunctionProject, MobilePageProject, WebPageProject, LibraryProject } from '@skedulo/packaging-internal-commons'
import { PackageService, IPreDeployErrors, AllProjectService } from '../../service-layer/package/PackageService'
import { ProjectService } from '../../service-layer/package/ProjectService'
import { MainServices } from '../../service-layer/MainServices'
import { ContentLayout } from '../Layout'
import { View } from '../App'
import { ActiveProjectWrapper } from './ActiveProjectWrapper'
import { DependenciesModal } from './DependenciesModal'

interface Props {
  package: PackageService
  refreshPackage: (goToConfiguration: boolean) => void
  setView: (view: View) => () => void
}

interface State {
  inProgress: boolean
  activeProject: ProjectService<FunctionProject> | ProjectService<MobilePageProject> | ProjectService<WebPageProject> | ProjectService<LibraryProject> | null
  dependenciesModalDependant:  AllProjectService | null
  preDeployCheckErrors: IPreDeployErrors | null
  deployStatus: string | null
}

export class ConfigurePackage extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      inProgress: false,
      activeProject: null,
      dependenciesModalDependant: null,
      preDeployCheckErrors: null,
      deployStatus: null
    }
  }

  componentDidUpdate() {
    const { dependenciesModalDependant } = this.state
    const { lambdas, webpages, libraries } = this.props.package

    if (!dependenciesModalDependant) {
      return
    }

    const currentDependant = [...lambdas, ...webpages, ...libraries]
      .find(proj => proj.project.name === dependenciesModalDependant.project.name)

    if (!currentDependant) {
      // Dependant has been removed, remove from state
      this.setState({ dependenciesModalDependant: null })
      return
    }

    if (!_.isEqual(currentDependant.project, dependenciesModalDependant.project)) {
      // Dependant has changed, set in state the new project
      this.setState({ dependenciesModalDependant: currentDependant })
    }
  }

  back = () => this.setState({ activeProject: null })
  closeModal = () => this.setState({ dependenciesModalDependant: null })

  selectProject = (selectedProject: AllProjectService) => () => this.setState({ activeProject: selectedProject })
  selectProjectDependencies = (selectedProject: AllProjectService) => () => this.setState({ dependenciesModalDependant: selectedProject })

  setDeployStatus = (status: string) => this.setState({ deployStatus: status })

  deploy = async () => {
    this.setState({ inProgress: true, deployStatus: null })

    try {
      const errors = this.props.package.preDeployChecks() as IPreDeployErrors
      const collatedErrors = Object
        .keys(errors)
        .reduce((acc, cur) => ([ ...acc, ...errors[cur] ]), [])

      if (!!collatedErrors.length) {
        this.setState({ preDeployCheckErrors: errors })
        MainServices.showErrorMessage('Error', 'Found errors. Please fix the error messages and try again!')
        return
      } else {
        this.setState({ preDeployCheckErrors: null })
      }

      await this.props.package.deploy(this.setDeployStatus)
      this.setState({ deployStatus: 'Deploy success!' })
      MainServices.showMessageBox({ type: 'info', title: 'Deploy', message: 'Deploy success!' })
    } catch (error) {
      this.setState({ deployStatus: error.message })
      MainServices.showErrorMessage('Deploy', 'Deploy failed! Please check the error message.')
    } finally {
      this.setState({ inProgress: false })
    }
  }

  renderProjectList(projects: AllProjectService[]) {
    if (!projects.length) {
      return <div>None</div>
    }

    return projects.map(p => {

      const { name, description } = p.project

      return (
        <div key={ name } className="card-list-item flow-root">
          <div className="float-left">
            <h3 className="h3">{ name }</h3>
            <p>{ description }</p>
          </div>

          <ButtonGroup className="float-right">
            <Button buttonType="secondary" compact onClick={ this.selectProjectDependencies(p) } disabled={ this.state.inProgress }>
              Dependencies
            </Button>
            <Button buttonType="primary" compact onClick={ this.selectProject(p) } disabled={ this.state.inProgress }>
              Develop
            </Button>
          </ButtonGroup>
        </div>
      )
    })
  }

  renderActiveProject = () => {
    const { package: packageService } = this.props
    const selectedProject = this.state.activeProject!

    return (
      <ActiveProjectWrapper
        packageService={ packageService }
        activeProjects={ [selectedProject] }
        back={ this.back }
      />
    )
  }

  renderConfigurePackageHeader = () => (
    <div className="flex-row new-project">
      <div className="new-project-title">{ this.props.package.packageMetadata.name }</div>
      <div className="flex-expanded-cell">{ this.props.package.packageMetadata.summary }</div>
      <Button
        buttonType="primary"
        compact={false}
        onClick={ this.deploy }
        disabled={ this.state.inProgress }
        loading={ this.state.inProgress }
        icon="upload"
      >
        Upload source
      </Button>
    </div>
  )

  renderConfigurePackageProjectLists = () => {
    const { lambdas, webpages, libraries } = this.props.package

    return (
      <>
        <div className="card">
          <div className="card__header">
            Functions
            <Button buttonType="secondary" className="float-right" onClick={ this.props.setView(View.CreateFunctionProject) } disabled={ this.state.inProgress }>Add Function</Button>
          </div>
          { this.renderProjectList(lambdas) }
        </div>
        <div className="card">
          <div className="card__header">
            Web Pages
            <Button buttonType="secondary" className="float-right" onClick={ this.props.setView(View.CreateWebpageProject) } disabled={ this.state.inProgress }>Add Connected Page</Button>
          </div>
          { this.renderProjectList(webpages) }
        </div>
        <div className="card">
          <div className="card__header">
            Libraries
            <Button buttonType="secondary" className="float-right" onClick={ this.props.setView(View.CreateLibraryProject) } disabled={ this.state.inProgress }>Add Library</Button>
          </div>
          { this.renderProjectList(libraries) }
        </div>
      </>
    )
  }

  renderConfigurePackageView = () => {
    const { preDeployCheckErrors, deployStatus } = this.state

    return (
      <ContentLayout>
        { this.renderConfigurePackageHeader() }
        <hr />
        { deployStatus && <div className={ 'callout ' + (deployStatus.includes('error') ? 'alert' : 'success') }>{ deployStatus }</div> }
        { preDeployCheckErrors && this.renderPreDeployErrors(preDeployCheckErrors) }
        { this.renderConfigurePackageProjectLists() }
      </ContentLayout>
    )
  }

  renderContentView = () => {
    const { activeProject } = this.state

    return !!activeProject
      ? this.renderActiveProject()
      : this.renderConfigurePackageView()
  }

  renderPreDeployErrors = (errors: IPreDeployErrors) => Object
    .keys(errors)
    .filter(project => !!errors[project].length)
    .map(project => errors[project].map((error, index) => <div key={ `${project}-${index}` } className="callout warning">{ `${project} - ${error}` }</div>))

  render() {
    const { refreshPackage, package: pkg } = this.props
    const { dependenciesModalDependant } = this.state

    return (
      <>
        { this.renderContentView() }
        { !!dependenciesModalDependant && 
          <DependenciesModal 
            selectedProject={ dependenciesModalDependant }
            refreshPackage={ refreshPackage }
            package={ pkg }
            closeModal={ this.closeModal }
          /> 
        }
      </>
    )
  }
}
