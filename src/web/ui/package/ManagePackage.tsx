import * as React from 'react'
import * as _ from 'lodash'
import { FunctionProject, MobilePageProject, WebPageProject } from '@skedulo/sked-commons'

import { FunctionProjectService } from '../../service-layer/package/FunctionProjectService'
import { MobilePageProjectService } from '../../service-layer/package/MobilePageProjectService'
import { PackageService, IPreDeployErrors } from '../../service-layer/package/PackageService'
import { ProjectService } from '../../service-layer/package/ProjectService'
import { MainServices } from '../../service-layer/MainServices'
import { WebPageProjectService } from '../../service-layer/package/WebPageProjectService'
import { ContentLayout } from '../Layout'
import { ActiveProjectWrapper } from './ActiveProjectWrapper'
import { View } from '../App'

interface Props {
  package: PackageService,
  setView: (view: View) => () => void
}


interface State {
  inProgress: boolean
  selectedProject: ProjectService<FunctionProject> | ProjectService<MobilePageProject> | ProjectService<WebPageProject> | null
  preDeployCheckErrors: IPreDeployErrors | null
  deployStatus: string | null
}

export class ManagePackage extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      inProgress: false,
      selectedProject: null,
      preDeployCheckErrors: null,
      deployStatus: null
    }
  }

  back = () => this.setState({ selectedProject: null })
  selectProject = (selectedProject: ProjectService<any>) => () => this.setState({ selectedProject })
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

  renderFunctionList(projects: FunctionProjectService[]) {

    if (!projects.length) {
      return <div>None</div>
    }

    return projects.map(p => {

      const { name, description } = p.project

      return (
        <div key={ name }>
          <h3>{ name }</h3>
          <p>{ description }</p>
          <button className="sk-button primary" onClick={ this.selectProject(p) } disabled={ this.state.inProgress }>Develop</button>
        </div>
      )
    })
  }

  renderMobilepageList(projects: MobilePageProjectService[]) {

    if (!projects.length) {
      return <div>None</div>
    }

    return projects.map(p => {

      const { name, description } = p.project

      return (
        <div key={ name }>
          <h3>{ name }</h3>
          <p>{ description }</p>
          <button className="sk-button primary" onClick={ this.selectProject(p) } disabled={ this.state.inProgress }>Develop</button>
        </div>
      )
    })
  }

  renderWebpageList(projects: WebPageProjectService[]) {

    if (!projects.length) {
      return <div>None</div>
    }

    return projects.map(p => {

      const { name, description } = p.project

      return (
        <div key={ name }>
          <h3>{ name }</h3>
          <p>{ description }</p>
          <button className="sk-button primary" onClick={ this.selectProject(p) } disabled={ this.state.inProgress }>Develop</button>
        </div>
      )
    })
  }

  renderActiveProject = () => {
    const { package: packageService } = this.props
    const selectedProject = this.state.selectedProject!
    const relatedProjects = this.props.package.getRelatedProjectsForProject(selectedProject)

    return (
      <ActiveProjectWrapper
        packageService={ packageService }
        activeProjects={ [selectedProject, ...relatedProjects] }
        // selectedProject={ selectedProject }
        back={ this.back }
      />
    )
  }


  renderPreDeployErrors = (errors: IPreDeployErrors) => Object
    .keys(errors)
    .filter(project => !!errors[project].length)
    .map(project => errors[project].map((error, index) => <div key={ `${project}-${index}` } className="callout warning">{ `${project} - ${error}` }</div>))

  render() {
    const pkg = this.props.package.packageMetadata
    const { lambdas, webpages } = this.props.package
    const { preDeployCheckErrors, deployStatus } = this.state

    return this.state.selectedProject ? this.renderActiveProject() : (
      <ContentLayout>
        <div className="flex-row new-project">
          <div className="new-project-title">{ pkg.name }</div>
          <div className="flex-expanded-cell">{ pkg.summary }</div>
          <button className="sk-button primary" onClick={ this.deploy } disabled={ this.state.inProgress }>Deploy</button>
        </div>
        <hr />

        { deployStatus && <div className={ 'callout ' + (deployStatus.includes('error') ? 'alert' : 'success') }>{ deployStatus }</div> }

        { preDeployCheckErrors && this.renderPreDeployErrors(preDeployCheckErrors) }

        <div className="card">
          <div className="h2 title">
            Functions
            <button className="sk-button secondary float-right" onClick={ this.props.setView(View.CreateFunctionProject) } disabled={ false }>Add Project</button>
          </div>
          { this.renderFunctionList(lambdas) }
        </div>
        <div className="card">
          <div className="h2 title">
            Web Pages
            <button className="sk-button secondary float-right" onClick={ this.props.setView(View.CreateWebpageProject) } disabled={ false }>Add Project</button>
          </div>
          { this.renderWebpageList(webpages) }
        </div>
        {/* <div className="card">
          <div className="h2 title">
            Mobile Pages
            <button className="sk-button secondary float-right" onClick={ this.deploy } disabled={ this.state.inProgress }>Add Project</button>
          </div>
          { this.renderMobilepageList(mobilepages) }
        </div> */}
      </ContentLayout>
    )
  }
}
