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
  FormSubmission
} from '@skedulo/sked-ui'
import { MobilePageProject, ProjectType } from '@skedulo/packaging-internal-commons'
import { PackageService } from '../../service-layer/package/PackageService'
import { getMobileSuiteTemplates } from '../../service-layer/package/template-utils'
import { MobilePageBoilerplateSuite, createMobilePageSuite } from '../../service-layer/package/interproject-utils'
import { ContentLayout } from '../Layout'
import { PROJECT_NAME_VALIDATION, FUNCTION_PROJECT_NAME_VALIDATION, PROJECT_DESCRIPTION_VALIDATION } from './validation-configuration'

export interface IProps {
  back: () => void
  selectedPackage: PackageService
  refreshPackage: (goToConfiguration: boolean, refreshLinks: boolean) => Promise<void>
}

export interface IState {
  progress: boolean
  errorMsg: string
}

interface MobilePageProjectForm {
  name: string
  label: string
  functionName: string
  description: string
  suiteType: MobilePageBoilerplateSuite | null
}

function convertFormToProjectMetadata(form: MobilePageProjectForm): MobilePageProject {
  return {
    name: form.name,
    label: form.label,
    description: form.description,
    type: ProjectType.MobilePage,
    context: 'job',
    required: false,
    lifecycleFunction: form.functionName
  }
}

export class NewMobilePageProject extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: ''
    }
  }

  DEFAULT_FORM_VALUES: MobilePageProjectForm = {
    name: '',
    label: '',
    description: '',
    functionName: '',
    suiteType: null
  }
  
  VALIDATION_CONFIG: FormConfig<any> = {
    name: PROJECT_NAME_VALIDATION,
    label: {
      isRequired: {
        message: 'Please enter a display label'
      }
    },
    functionName: FUNCTION_PROJECT_NAME_VALIDATION,
    suiteType: {
      isRequired: {
        message: 'Please select a template'
      }
    },
    description: PROJECT_DESCRIPTION_VALIDATION
  }

  createProject = async (formState: FormSubmission<MobilePageProjectForm>) => {
    const { selectedPackage, refreshPackage } = this.props

    this.setState({ progress: true })

    try {
      await createMobilePageSuite(
        formState.fields.suiteType!,
        selectedPackage,
        convertFormToProjectMetadata(formState.fields),
        {} as any
      )

      // Refresh package in state (this will also refresh the view)
      await refreshPackage(true, true)
    } catch (error: any) {
      this.setState({
        progress: false,
        errorMsg: error.message
      })
    }
  }

  renderTemplateOptions = () => {
    const templates = getMobileSuiteTemplates()

    return templates.map(t => <option key={ t.type } value={ t.type }>{ t.name }</option>)
  }

  customProjectNameValidation = (projectName: string, allFields: MobilePageProjectForm) => {
    const { selectedPackage } = this.props

    if (allFields.functionName && allFields.name && allFields.functionName === allFields.name) {
      return {
        isValid: false,
        error: 'Function name must be different to project name'
      }
    }

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

  renderNewProjectForm = () => {
    const { createProject, customProjectNameValidation } = this
    const { progress } = this.state
    const { back } = this.props

    return (
      <SkedFormValidation
        config={ this.VALIDATION_CONFIG }
        initialValues={ this.DEFAULT_FORM_VALUES }
        onSubmit={ createProject }
      >
        {
          ({ isValidAfterModified, submit, fields }) => {
            return (
              <React.Fragment>
                <FormElementWrapper name="name" size="full" className="text-left" validation={ customProjectNameValidation(fields.name, fields) || isValidAfterModified('name') }>
                  <FormLabel className="span-label">Name</FormLabel>
                  <FormInputElement name="name" type="text" value={ fields.name } />
                </FormElementWrapper>

                <FormElementWrapper name="label" size="full" className="text-left" validation={ isValidAfterModified('label') }>
                  <FormLabel className="span-label">Display Label (as displayed in mobile app)</FormLabel>
                  <FormInputElement name="label" type="text" value={ fields.label } />
                </FormElementWrapper>

                <FormElementWrapper name="description" size="full" className="text-left" validation={ isValidAfterModified('description') }>
                  <FormLabel className="span-label">Description</FormLabel>
                  <FormInputElement name="description" type="text" value={ fields.description } />
                </FormElementWrapper>

                <FormElementWrapper name="functionName" size="full" className="text-left" validation={ customProjectNameValidation(fields.functionName, fields) || isValidAfterModified('functionName') }>
                  <FormLabel className="span-label">Function Name (shorter variant of name)</FormLabel>
                  <FormInputElement name="functionName" type="text" value={ fields.functionName } />
                </FormElementWrapper>

                <FormElementWrapper name="suiteType" size="full" className="text-left" validation={ isValidAfterModified('suiteType') }>
                  <FormLabel className="span-label">Template</FormLabel>
                  <select name="suiteType" disabled={ this.state.progress }>
                    <option key="blank">Select template</option>
                    { this.renderTemplateOptions() }
                  </select>
                </FormElementWrapper>

                <ButtonGroup>
                  <Button buttonType="transparent" disabled={ progress } onClick={ back }>
                    Cancel
                  </Button>
                  <Button buttonType="primary" loading={ progress } onClick={ submit }>
                    Create Mobile Extension Suite
                  </Button>
                </ButtonGroup>
              </React.Fragment>
            )
          }
        }
      </SkedFormValidation>
    )
  }

  render() {
    const { renderNewProjectForm } = this
    const { errorMsg } = this.state

    return (
      <ContentLayout centered>
        <h1>Create Mobile Extension Project</h1>
        { errorMsg && <div className="callout warning">{ errorMsg }</div> }

        <div className="padding-top padding-bottom">
          { renderNewProjectForm() }
        </div>
      </ContentLayout>
    )
  }
}
