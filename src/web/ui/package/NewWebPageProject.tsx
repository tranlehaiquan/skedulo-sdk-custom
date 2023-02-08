import * as _ from 'lodash'
import * as React from 'react'
import {
  SkedFormValidation,
  FormElementWrapper,
  FormInputElement,
  FormLabel,
  FormConfig,
  ButtonGroup,
  Button,
  ValidationProps,
  FormSubmission
} from '@skedulo/sked-ui'
import {
  WebPageProject,
  WebPageType,
  WebPageHook,
  ProjectType
} from '@skedulo/packaging-internal-commons'

import { WebPageProjectService } from '../../service-layer/package/WebPageProjectService'
import { PackageService } from '../../service-layer/package/PackageService'
import { getWebpageProjectTemplate } from '../../service-layer/package/template-utils'

import { ContentLayout } from '../Layout'
import { PROJECT_DESCRIPTION_VALIDATION, PROJECT_NAME_VALIDATION } from './validation-configuration'

export interface IProps {
  back: () => void
  selectedPackage: PackageService
  refreshPackage: (goToConfiguration: boolean) => Promise<void>
}

export interface IState {
  progress: boolean
  errorMsg: string
}

interface WebPageProjectForm {
  name: string,
  description: string,
  label: string,
  url: string,
  renderType: WebPageType,
  embeddedHook: WebPageHook | null,
  showInNavBar: string
}

function convertFormToProjectMetadata(form: WebPageProjectForm): WebPageProject {
  return {
    type: ProjectType.WebPage,
    url: form.url,
    name: form.name,
    label: form.label,
    description: form.description,
    render: form.renderType === WebPageType.Embedded && !!form.embeddedHook
      ? {
        type: WebPageType.Embedded,
        hook: form.embeddedHook,
        showInNavBar: !(form.showInNavBar == '')
      } : {
        type: WebPageType.Page,
        showInNavBar: !(form.showInNavBar == '')
      }
  }
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

export class NewWebPageProject extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: ''
    }
  }

  DEFAULT_FORM_VALUES: WebPageProjectForm = {
    name: '',
    description: '',
    label: '',
    url: '',
    renderType: '' as WebPageType,
    embeddedHook: null,
    showInNavBar: 'true'
  }

  VALIDATION_CONFIG: FormConfig<any> = {
    name: PROJECT_NAME_VALIDATION,
    description: PROJECT_DESCRIPTION_VALIDATION,
    label: {
      isRequired: {
        message: 'Please enter a webpage label'
      }
    },
    url: {
      isRequired: {
        message: 'Please enter a project url'
      },
      isRegexMatch: {
        regex: /^[a-z0-9-_]+$/i,
        message: 'Please enter a valid project url'
      } as any
    },
    renderType: {
      isRequired: {
        message: 'Please select the render type'
      }
    },
    embeddedHook: {
      // @ts-ignore
      isRequired: ({ fields }) => ({
        message: 'Please select the embedded hook',
        validateIf: fields.renderType === WebPageType.Embedded
      })
    }
  }

  createProject = async (formState: FormSubmission<WebPageProjectForm>) => {
    const { selectedPackage, refreshPackage } = this.props

    const pkgDirectory = selectedPackage.packagePath
    const metadata = formState.fields

    console.log(metadata)
    this.setState({ progress: true })

    try {
      return await WebPageProjectService
        // TODO Jess: Pull in boilerplates from boilerplate project on build and remove link to Legacy Services!  
        .create(pkgDirectory, metadata.name, getWebpageProjectTemplate().path, convertFormToProjectMetadata(metadata), {} as any)
        .then(async () => {
          // Update the package metadata file
          selectedPackage.addPackageComponents({
            webpages: {
              items: [metadata.name]
            }
          })

          // Refresh package in state (this will also refresh the view)
          refreshPackage(true)
        })
    } catch (error: any) {
      this.setState({
        progress: false,
        errorMsg: error.message
      })
    }
  }

  customProjectNameValidation = (projectName: string) => {
    const { selectedPackage } = this.props

    if (projectName.length) {
      // Check uniqueness of name in project
      const allProjectNamesInCurrentPackage = selectedPackage.getAllProjectNames()
        if(allProjectNamesInCurrentPackage.includes(projectName)) {
          return {
            isValid: false,
            error: `A project with name ${projectName} already exists`
          }
        }
    }
  }

  renderWebpageTypes = (isValidAfterModified: (fieldName: string) => ValidationProps['validation']) => (
    <FormElementWrapper name="renderType" size="full" className="text-left" validation={ isValidAfterModified('renderType') }>
      <FormLabel className="span-label">Render type</FormLabel>
      <select name="renderType" disabled={ this.state.progress }>
        <option key="blank">Select render type</option>
        { renderTypes.map(item => <option key={ item.type } value={ item.type }>{ item.name }</option>) }
      </select>
    </FormElementWrapper>
  )

  renderEmbeddedHooks = (isValidAfterModified: (fieldName: string) => ValidationProps['validation']) => (
    <FormElementWrapper name="embeddedHook" size="full" className="text-left" validation={ isValidAfterModified('embeddedHook') }>
      <FormLabel className="span-label">Embedded hook</FormLabel>
      <select name="embeddedHook" disabled={ this.state.progress }>
        <option key="blank">Select embedded hook</option>
        { embeddedHooks.map(item => <option key={ item.hook } value={ item.hook }>{ item.name }</option>) }
      </select>
    </FormElementWrapper>
  )

  renderNewWebpageForm = () => {
    const { renderWebpageTypes, renderEmbeddedHooks, createProject, customProjectNameValidation } = this
    const { progress } = this.state
    const { back } = this.props

    return (
      <SkedFormValidation
        config={ this.VALIDATION_CONFIG }
        initialValues={ this.DEFAULT_FORM_VALUES }
        onSubmit={ createProject }
      >
        {
          ({ isValidAfterModified, submit, fields }) => (
            <React.Fragment>
              <FormElementWrapper name="name" size="full" className="text-left" validation={ customProjectNameValidation(fields.name) || isValidAfterModified('name') }>
                <FormLabel className="span-label">Name</FormLabel>
                <FormInputElement type="text" name="name" value={ fields.name } />
              </FormElementWrapper>
              <FormElementWrapper name="label" size="full" className="text-left" validation={ isValidAfterModified('label') }>
                  <FormLabel className="span-label">Display Label (as displayed in navigation)</FormLabel>
                  <FormInputElement name="label" type="text" value={ fields.label } />
                </FormElementWrapper>
              <FormElementWrapper name="description" size="full" className="text-left" validation={ isValidAfterModified('description') }>
                <FormLabel className="span-label">Description</FormLabel>
                <FormInputElement name="description" type="text" value={ fields.description } />
              </FormElementWrapper>
              <FormElementWrapper name="url" size="full" className="text-left" validation={ isValidAfterModified('url') }>
                <FormLabel className="span-label">URL</FormLabel>
                <FormInputElement name="url" type="text" value={ fields.url } />
              </FormElementWrapper>
              { renderWebpageTypes(isValidAfterModified) }
              { fields.renderType && fields.renderType === WebPageType.Embedded && renderEmbeddedHooks(isValidAfterModified) }
              <label>
                <span className="span-label">Show In Nav Bar?</span>
                <FormInputElement
                  name="showInNavBar"
                  type="checkbox"
                  checked={ !(fields.showInNavBar == '') }
                />
              </label>
              <ButtonGroup>
                <Button buttonType="transparent" disabled={ progress } onClick={ back }>
                  Cancel
                </Button>
                <Button buttonType="primary" loading={ progress } onClick={ submit }>
                  Create Webpage Project
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
