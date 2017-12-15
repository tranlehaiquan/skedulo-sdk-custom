import * as _ from 'lodash'
import * as React from 'react'

import { ContentLayout } from './Layout'
import { ProjectData } from '../service-layer/types'
import { ProjectServices } from '../service-layer/ProjectServices'
import { MainServices } from '../service-layer/MainServices'

import { FormHelper, slugify } from './form-utils'

export interface IProps {
  back: () => void
  selectProject: (project: string) => void
}

export interface IState {
  templates: { name: string, path: string }[]
  progress: boolean

  project: {
    selectedTemplate: string
    selectedDirectory: string
  },

  projectMetadata: ProjectData
}

export class NewProject extends React.PureComponent<IProps, IState> {

  private projectMetadataForm: FormHelper<IState['projectMetadata']>
  private projectForm: FormHelper<IState['project']>

  constructor(props: IProps) {

    super(props)

    const templates = ProjectServices.getTemplates()

    this.state = {
      templates,
      progress: false,

      project: {
        selectedTemplate: templates[0].path,
        selectedDirectory: ''
      },

      projectMetadata: {
        url: '',
        title: '',
        menuID: ''
      }
    }

    this.projectForm = new FormHelper(this.state.project, project => this.setState({ project }))
    this.projectMetadataForm = new FormHelper(this.state.projectMetadata, projectMetadata => this.setState({ projectMetadata }))
  }

  urlBlurTransform = (e: React.ChangeEvent<HTMLInputElement>) => slugify(e.currentTarget.value)

  urlBasedOnTitleBlurTransform = () => {
    const { title, url } = this.state.projectMetadata
    return title && !url ? slugify(title) : url
  }

  menuIdTransform = (e: React.ChangeEvent<HTMLInputElement>) => e.currentTarget.value.trim().substr(0, 2).toUpperCase()
  selectDirectoryTransform = () => _.head(MainServices.selectDirectory()) || ''

  createProject = () => {

    const { projectMetadata, project } = this.state
    const { selectedDirectory, selectedTemplate } = project

    this.setState({ progress: true })

    return ProjectServices
      .createProject(selectedDirectory, selectedTemplate, projectMetadata, {} as any)
      .then(() => this.props.selectProject(selectedDirectory!))
  }

  renderTemplateOptions() {
    return this.state.templates.map(template => {
      return <option key={ template.name } value={ template.path }>{ template.name }</option>
    })
  }

  render() {

    const { state, projectForm, projectMetadataForm, selectDirectoryTransform, urlBlurTransform, menuIdTransform, urlBasedOnTitleBlurTransform } = this
    const { projectMetadata, project } = state

    return (
      <ContentLayout centered>

        <h1>Create Connected Page</h1>

        <div className="padding-top padding-bottom">
          <label className="required">
            <span className="span-label">Page title</span>
            <input type="text" value={ projectMetadata.title } onChange={ projectMetadataForm.setMap('title') } onBlur={ projectMetadataForm.setMap('url', urlBasedOnTitleBlurTransform) } />
          </label>
          <label className="required">
            <span className="span-label">Page URL</span>
            <input type="text" value={ projectMetadata.url } onChange={ projectMetadataForm.setMap('url') } onBlur={ projectMetadataForm.setMap('url', urlBlurTransform) } />
          </label>
          <label className="required">
            <span className="span-label">Menu I.D.</span>
            <input type="text" value={ projectMetadata.menuID } onChange={ projectMetadataForm.setMap('menuID', menuIdTransform) } />
          </label>
          <hr />
          <label>
            <span className="span-label">Base template</span>
            <select onChange={ projectForm.setMap('selectedTemplate') } disabled={ this.state.progress }>
              <option key="blank">Select template</option>
              { this.renderTemplateOptions() }
            </select>
          </label>
          <label>
            <span className="span-label">Directory</span>
            <input
              type="text"
              placeholder="Select project directory"
              value={ project.selectedDirectory } onClick={ projectForm.setMap('selectedDirectory', selectDirectoryTransform) } />
          </label>
        </div>

        { !this.state.progress
          ? <div>
            <button className="sk-button transparent" onClick={ this.props.back }>Cancel</button>
            <button
              className="sk-button primary"
              onClick={ this.createProject }
              disabled={ !(projectForm.isValid() && projectMetadataForm.isValid()) }>
              Create page</button>
          </div>
          : <p>Preparing page. Please wait...</p>
        }

      </ContentLayout>
    )
  }
}
