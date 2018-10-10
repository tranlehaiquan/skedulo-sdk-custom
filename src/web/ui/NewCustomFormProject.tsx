import * as _ from 'lodash'
import * as React from 'react'

import { ContentLayout } from './Layout'
import { MobileProjectData } from '../service-layer/types'
import { MobileProjectServices } from '../service-layer/MobileProjectServices'
import { MainServices } from '../service-layer/MainServices'

import { FormHelper } from './form-utils'

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

  projectMetadata: MobileProjectData
}

export class NewCustomFormProject extends React.PureComponent<IProps, IState> {

  private projectMetadataForm: FormHelper<IState['projectMetadata']>
  private projectForm: FormHelper<IState['project']>

  constructor(props: IProps) {

    super(props)

    const templates = MobileProjectServices.getTemplates()

    this.state = {
      templates,
      progress: false,

      project: {
        selectedTemplate: templates[0].path,
        selectedDirectory: ''
      },

      projectMetadata: {
        projectName: '',
        formType: 'job'
      }
    }

    this.projectForm = new FormHelper(this.state.project, project => this.setState({ project }))
    this.projectMetadataForm = new FormHelper(this.state.projectMetadata, projectMetadata => this.setState({ projectMetadata }))
  }

  selectDirectoryTransform = () => _.head(MainServices.selectDirectory()) || ''

  createProject = () => {

    const { projectMetadata, project } = this.state
    const { selectedDirectory, selectedTemplate } = project

    this.setState({ progress: true })

    return MobileProjectServices
      .createProject(selectedDirectory, selectedTemplate, projectMetadata, {} as any)
      .then(() => this.props.selectProject(selectedDirectory!))
  }

  renderTemplateOptions() {
    return this.state.templates.map(template => {
      return <option key={ template.name } value={ template.path }>{ template.name }</option>
    })
  }

  render() {

    const { state, projectForm, projectMetadataForm, selectDirectoryTransform } = this
    const { projectMetadata, project } = state

    return (
      <ContentLayout centered>

        <h1>Create Custom Form</h1>

        <div className="padding-top padding-bottom">
          <label className="required">
            <span className="span-label">Project Name</span>
            <input type="text" value={ projectMetadata.projectName } onChange={ projectMetadataForm.setMap('projectName') } />
          </label>
          <div>
            <span className="span-label small-3">Display Type</span>
            <div>
              <label className="small-4">
                <input
                  type="radio"
                  className="sk-radio"
                  name="job-display"
                  checked={ projectMetadata.formType === 'job' }
                  onChange={ () => projectMetadataForm.set('formType', 'job') }
                />Job Details
              </label>
              <label className="small-4">
                <input
                  type="radio"
                  className="sk-radio"
                  name="resource-display"
                  checked={ projectMetadata.formType === 'resource' }
                  onChange={ () => projectMetadataForm.set('formType', 'resource') }
                />Resource Menu
              </label>
            </div>
          </div>
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
              Create form</button>
          </div>
          : <p>Preparing form. Please wait...</p>
        }

      </ContentLayout>
    )
  }
}
