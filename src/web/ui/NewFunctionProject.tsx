import * as _ from 'lodash'
import * as React from 'react'
import {
  SkedFormValidation,
  FormElementWrapper,
  FormInputElement,
  FormLabel,
  // @ts-ignore - no idea why TS throws "module not found" error here. 'FormConfig' is referenced fine in Phoenix
  FormConfig,
  SkedFormChildren,
  ButtonGroup,
  Button
} from '@skedulo/sked-ui'
import {
  Option,
  Lens,
  FunctionProject,
  SelectedPackage,
  Package,
  ProjectType,
  NodeVersion
} from '@skedulo/sked-commons'

import { ContentLayout } from './Layout'
import { FormHelper } from './form-utils'
import { ProjectServices } from '../service-layer/ProjectServices'
import { PackageService } from '../service-layer/package/PackageService'
import { NEW_PKG_METADATA } from './CreateNewPackage'
import { View } from './App'

export interface IProps {
  back: () => void
  selectedPackage: SelectedPackage | null
  setView: (view: View) => () => void
  setPackage: (pkgDirectory: SelectedPackage['directory']) => void
}

export interface IState {
  progress: boolean,
  errorMsg: string,
  project: {
    defaultTemplate: { name: string, path: string }
  },
  projectMetadata: FunctionProject,
}

interface FunctionProjectForm {
  name: string,
  description: string
}

export const NEW_FUNCTION_PRJ_METADATA: FunctionProject = {
  type: ProjectType.Function,
  runtime: NodeVersion.V810,
  genTypes: false,
  name: '',
  description: ''
}

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

export class NewFunctionProject extends React.PureComponent<IProps, IState> {
  private projectMetadataForm: FormHelper<IState['projectMetadata']>

  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: '',
      project: {
        defaultTemplate: ProjectServices.getFunctionProjectTemplate()
      },
      projectMetadata: NEW_FUNCTION_PRJ_METADATA
    }

    this.projectMetadataForm = new FormHelper(
      this.state.projectMetadata,
      projectMetadata => this.setState({ projectMetadata })
    )
  }

  getUpdatedPackageMetadata = () => {
    const { selectedPackage } = this.props
    const { projectMetadata } = this.state

    const metadata = Option.of(selectedPackage).next('metaData').getOrElse(NEW_PKG_METADATA)
    const existingFunctionProjects = Option.of(selectedPackage).next('metaData').next('components').next('functions').getOrElse({ items: [] }) as { items: string[] }
    const { items } = existingFunctionProjects

    return Lens('components', 'functions', 'items').over(_items => [ ...items, projectMetadata.name ])(metadata) as Package
  }

  createProject = () => {
    const { getUpdatedPackageMetadata } = this
    const { projectMetadata, project } = this.state
    const { selectedPackage, setView, setPackage } = this.props
    const { defaultTemplate } = project
    const pkgDirectory = Option.of(selectedPackage).next('directory').getOrElse('')


    this.setState({ progress: true })

    try {
      const functionProjectDirectory = `${pkgDirectory}/${projectMetadata.name}`

      return ProjectServices
        .createProject(functionProjectDirectory, defaultTemplate.path, projectMetadata, {} as any)
        .then(() => {
          PackageService.createPackage(pkgDirectory, getUpdatedPackageMetadata())
          setPackage(pkgDirectory)
          this.setState({ progress: false, errorMsg: '' })
          setView(View.ConfigurePackage)()
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

  renderNewProjectForm = () => {
    const { createProject, updateAndValidateField, projectMetadataForm } = this
    const { projectMetadata, progress } = this.state
    const { back } = this.props
    const initialFormValues: FunctionProjectForm = {
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
          ({ isValidAfterModified, customFieldUpdate, submit }) => {
            return (
              <React.Fragment>
                <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('name') }>
                  <FormLabel className="span-label">Name</FormLabel>
                  <FormInputElement type="text" value={ projectMetadata.name } onChange={ updateAndValidateField('name', customFieldUpdate) } onBlur={ projectMetadataForm.setMap('name') } />
                </FormElementWrapper>

                <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('description') }>
                  <FormLabel className="span-label">Description</FormLabel>
                  <FormInputElement type="text" value={ projectMetadata.description } onChange={ updateAndValidateField('description', customFieldUpdate) } onBlur={ projectMetadataForm.setMap('description') } />
                </FormElementWrapper>

                <ButtonGroup className="sk-button-group">
                  <Button buttonType="transparent" onClick={ back }>
                    Cancel
                  </Button>
                  <Button buttonType="primary" onClick={ submit }>
                    { progress ? 'Creating project. Please wait...' : 'Create Function Project' }
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
        <h1>Create Function Project</h1>
        { errorMsg && <div className="callout warning">{ errorMsg }</div> }

        <div className="padding-top padding-bottom">
          { renderNewProjectForm() }
        </div>
      </ContentLayout>
    )
  }
}
