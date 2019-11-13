
import * as React from 'react'
import { FunctionProjectService } from '../../service-layer/package/FunctionProjectService'
import { MobilePageProjectService } from '../../service-layer/package/MobilePageProjectService'
import { FunctionProject, MobilePageProject, WebPageProject } from '../../service-layer/package/package-types.def'
import { PackageService } from '../../service-layer/package/PackageService'
import { ProjectService } from '../../service-layer/package/ProjectService'
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
}

export class ManagePackage extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props)
    this.state = {
      inProgress: false,
      selectedProject: null
    }
  }

  back = () => this.setState({ selectedProject: null })
  selectProject = (selectedProject: ProjectService<any>) => () => this.setState({ selectedProject })

  deploy = async () => {

    this.setState({ inProgress: true })

    try {
      await this.props.package.deploy()
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
        back={ this.back }
      />
    )
  }

  render() {
    const pkg = this.props.package.packageMetadata
    const { mobilepages, lambdas, webpages } = this.props.package

    return this.state.selectedProject ? this.renderActiveProject() : (
      <ContentLayout>
        <div className="flex-row new-project">
          <div className="new-project-title">{ pkg.name }</div>
          <div className="flex-expanded-cell">{ pkg.summary }</div>
          <button className="sk-button primary" onClick={ this.deploy } disabled={ this.state.inProgress }>Deploy</button>
        </div>
        <hr />

        <div className="card">
          <div className="h2 title">
            Functions
            <button className="sk-button secondary" onClick={ this.props.setView(View.CreateFunctionProject) } disabled={ false }>Add Project</button>
          </div>
          { this.renderFunctionList(lambdas) }
        </div>
        <div className="card">
          <div className="h2 title">
            Web Pages
            <button className="sk-button secondary" onClick={ this.props.setView(View.CreateWebpageProject) } disabled={ false }>Add Project</button>
          </div>
          { this.renderWebpageList(webpages) }
        </div>
        <div className="card">
          <div className="h2 title">
            Mobile Pages
            <button className="sk-button secondary" disabled={ true }>Add Project</button>
          </div>
          { this.renderMobilepageList(mobilepages) }
        </div>
      </ContentLayout>
    )
  }
}
