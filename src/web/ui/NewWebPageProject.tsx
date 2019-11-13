import * as _ from 'lodash'
import * as React from 'react'
import {
  SkedFormValidation,
  FormElementWrapper,
  FormInputElement,
  FormLabel,
  // @ts-ignore
  FormConfig,
  SkedFormChildren,
  ButtonGroup,
  Button
} from '@skedulo/sked-ui'

import { ContentLayout } from './Layout'
import { FormHelper } from './form-utils'
import { Option, Lens } from '../utils'
import { ProjectServices } from '../service-layer/ProjectServices'
import { PackageService } from '../service-layer/package/PackageService'
import { WebPageProject, SelectedPackage, Package } from '../service-layer/package/package-types.def'
import { WebPageType, WebPageHook } from '../service-layer/package/enums'
import { ProjectType } from '../service-layer/package/enums'
import { NEW_PKG_METADATA } from './CreateNewPackage'
import { View } from './App'

export interface IProps {
  back: () => void
  selectedPackage: SelectedPackage | null
  setView: (view: View) => () => void
}

export interface IState {
  progress: boolean
  errorMsg: string
  project: {
    renderType: WebPageType | null
    embeddedHook: WebPageHook
    showInNavBar: boolean
    defaultTemplate: { name: string, path: string }
  }
  projectMetadata: WebPageProject
}

interface WebpageProjectForm {
  name: string
  description: string
}

export const NEW_WEBPAGE_PRJ_METADATA: WebPageProject = {
  type: ProjectType.WebPage,
  genTypes: false,
  name: '',
  description: '',
  url: '',
  render: null
}

const renderTypes = [
  {
    name: 'Embedded',
    type: WebPageType.Embedded
  },
  {
    name: 'Page',
    type: WebPageType.Page
  }
]

const embeddedHooks = [
  {
    name: 'Resource details',
    hook: WebPageHook.ResourceDetails
  },
  {
    name: 'Job details',
    hook: WebPageHook.JobDetails
  }
]

const VALIDATION_CONFIG: FormConfig = {
  name: {
    isRequired: {
      message: 'Please enter a project name'
    },
    isRegexMatch: {
      regex: /^[a-z0-9_]+$/i,
      message: 'Please enter a valid alphanumeric project name (use underscore)'
    }
  },
  description: {
    isRequired: {
      message: 'Please enter a project description'
    }
  }
}

export class NewWebPageProject extends React.PureComponent<IProps, IState> {
  private projectForm: FormHelper<IState['project']>
  private projectMetadataForm: FormHelper<IState['projectMetadata']>

  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: '',
      project: {
        renderType: null,
        embeddedHook: WebPageHook.JobDetails,
        showInNavBar: false,
        defaultTemplate: ProjectServices.getWebpageProjectTemplate()
      },
      projectMetadata: NEW_WEBPAGE_PRJ_METADATA
    }

    this.projectMetadataForm = new FormHelper(this.state.projectMetadata, projectMetadata => this.setState({ projectMetadata }))
    this.projectForm = new FormHelper(this.state.project, project => this.setState({ project }))
  }

  getUpdatedProjectMetadata = () => {
    const { project, projectMetadata } = this.state
    const { renderType, embeddedHook, showInNavBar } = project
    let renderData = null

    if (renderType === WebPageType.Embedded) {
      renderData = {
        showInNavBar,
        type: renderType,
        hook: embeddedHook
      }
    }

    if (renderType === WebPageType.Page) {
      renderData = {
        showInNavBar,
        type: renderType
      }
    }

    return {
      ...projectMetadata,
      render: renderData
    }
  }

  getUpdatedPackageMetadata = () => {
    const { selectedPackage } = this.props
    const { projectMetadata } = this.state

    const metadata = Option.of(selectedPackage).next('metaData').getOrElse(NEW_PKG_METADATA)
    const existingWebpageProjects = Option.of(selectedPackage).next('metaData').next('components').next('webpages').getOrElse({ items: [] }) as { items: string[] }
    const { items } = existingWebpageProjects

    return Lens('components', 'webpages', 'items').over(_items => [ ...items, projectMetadata.name ])(metadata) as Package
  }

  createProject = () => {
    const { getUpdatedProjectMetadata, getUpdatedPackageMetadata } = this
    const { project } = this.state
    const { selectedPackage, setView } = this.props
    const { defaultTemplate } = project
    const pkgDirectory = Option.of(selectedPackage).next('directory').getOrElse('')

    this.setState({ progress: true })

    try {
      const webpageProjectDirectory = `${pkgDirectory}/${getUpdatedProjectMetadata().name}`

      return ProjectServices
        .createProject(webpageProjectDirectory, defaultTemplate.path, getUpdatedProjectMetadata(), {} as any)
        .then(() => {
          PackageService.createPackage(pkgDirectory, getUpdatedPackageMetadata())
          this.setState({ progress: false, errorMsg: '' })
          setView(View.ManagePackages)()
        })
    } catch (error) {
      this.setState({
        progress: false,
        errorMsg: error.message
      })
    }
  }

  updateAndValidateField = (fieldName: 'name' | 'description', fieldUpdate: SkedFormChildren<FormConfig>['customFieldUpdate']) => (e: React.FormEvent<HTMLInputElement>) => {
    this.projectMetadataForm.setMap(fieldName)(e)
    fieldUpdate(fieldName)(e.currentTarget.value)
  }

  renderWebpageTypes = () => (
    <label>
      <span className="span-label">Render type</span>
      <select onChange={ this.projectForm.setMap('renderType') } disabled={ this.state.progress }>
        <option key="blank">Select render type</option>
        {renderTypes.map(item => <option key={ item.type } value={ item.type }>{ item.name }</option>)}
      </select>
    </label>
  )

  renderEmbeddedHooks = () => (
    <label>
      <span className="span-label">Embedded hook</span>
      <select onChange={ this.projectForm.setMap('embeddedHook') } disabled={ this.state.progress }>
        <option key="blank">Select embedded hook</option>
        {embeddedHooks.map(item => <option key={ item.hook } value={ item.hook }>{ item.name }</option>)}
      </select>
    </label>
  )

  renderShowInNavBar = () => (
    <label className="required">
      <span className="span-label">Show In Nav Bar?</span>
      <input type="checkbox" checked={ this.state.project.showInNavBar } onChange={ this.projectForm.setMap('showInNavBar', (e: React.FormEvent<HTMLInputElement>) => (e.target as HTMLInputElement).checked) } />
    </label>
  )

  renderNewWebpageForm = () => {
    const { projectMetadataForm, updateAndValidateField, renderWebpageTypes, renderEmbeddedHooks, renderShowInNavBar, createProject } = this
    const { projectMetadata, progress, project } = this.state
    const { back } = this.props
    const initialFormValues: WebpageProjectForm = {
      name: '',
      description: ''
    }

    return (
      <SkedFormValidation
        config={ VALIDATION_CONFIG }
        initialValues={ initialFormValues }
        onSubmit={ createProject }
      >
        {
          ({ isValidAfterModified, customFieldUpdate, submit }) => (
            <React.Fragment>
              <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('name') }>
                <FormLabel className="span-label">Name</FormLabel>
                <FormInputElement type="text" value={ projectMetadata.name } onChange={ updateAndValidateField('name', customFieldUpdate) } onBlur={ projectMetadataForm.setMap('name') } />
              </FormElementWrapper>
              <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('description') }>
                <FormLabel className="span-label">Description</FormLabel>
                <FormInputElement type="text" value={ projectMetadata.description } onChange={ updateAndValidateField('description', customFieldUpdate) } onBlur={ projectMetadataForm.setMap('description') } />
              </FormElementWrapper>
              { renderWebpageTypes() }
              { project.renderType && project.renderType === WebPageType.Embedded && renderEmbeddedHooks() }
              { renderShowInNavBar() }
              <ButtonGroup className="sk-button-group">
                <Button buttonType="transparent" onClick={ back }>
                  Cancel
                  </Button>
                <Button buttonType="primary" onClick={ submit }>
                  {progress ? 'Please wait...' : 'Create Function Project'}
                </Button>
              </ButtonGroup>
            </React.Fragment>
          )
        }
      </SkedFormValidation>
    )
  }

  render() {
    const { renderNewWebpageForm } = this
    const { errorMsg } = this.state

    return (
      <ContentLayout centered>
        <h1>Create Webpage Project</h1>
        { errorMsg && <div className="callout warning">{ errorMsg }</div> }

        <div className="padding-top padding-bottom">
          { renderNewWebpageForm() }
        </div>
      </ContentLayout>
    )
  }
}
