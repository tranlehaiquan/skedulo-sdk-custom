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
import {
  LibraryProject,
  ProjectType
} from '@skedulo/packaging-internal-commons'
import { ContentLayout } from '../Layout'
import { PackageService } from '../../service-layer/package/PackageService'
import { LibraryProjectService } from '../../service-layer/package/LibraryProjectService'
import { getLibraryProjectTemplate } from '../../service-layer/package/template-utils'
import { PROJECT_NAME_VALIDATION, PROJECT_DESCRIPTION_VALIDATION } from './validation-configuration'

export interface IProps {
  back: () => void
  selectedPackage: PackageService
  refreshPackage: (goToConfiguration: boolean) => void
}

export interface IState {
  progress: boolean
  errorMsg: string
}

interface LibraryProjectForm {
  name: string
  description: string
}

function convertFormToProjectMetadata(form: LibraryProjectForm): LibraryProject {
  return {
    name: form.name,
    description: form.description,
    type: ProjectType.Library
  }
}

const VALIDATION_CONFIG: FormConfig = {
  name: PROJECT_NAME_VALIDATION,
  description: PROJECT_DESCRIPTION_VALIDATION
}

export class NewLibraryProject extends React.PureComponent<IProps, IState> {
  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: ''
    }
  }

  createProject = async (formState: FormSubmission<LibraryProjectForm>) => {
    const { selectedPackage, refreshPackage } = this.props

    const pkgDirectory = selectedPackage.packagePath
    const metadata = formState.fields

    this.setState({ progress: true })

    try {
      return LibraryProjectService
        // TODO Jess: Pull in boilerplates from boilerplate project on build and remove link to Legacy Services!  
        .create(pkgDirectory, metadata.name, getLibraryProjectTemplate().path, convertFormToProjectMetadata(metadata), {} as any)
        .then(async () => {
          // Update the package metadata file
          selectedPackage.addPackageComponents({
            libraries: {
              items: [metadata.name]
            }
          })

          // Refresh package in state (this will also refresh the view)
          refreshPackage(true)
        })
    } catch (error) {
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

  renderNewLibraryForm = () => {
    const { createProject, customProjectNameValidation } = this
    const { progress } = this.state
    const { back } = this.props

    const initialFormValues: LibraryProjectForm = {
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
          ({ isValidAfterModified, submit, fields }) => (
            <React.Fragment>
                <FormElementWrapper name="name" size="full" className="text-left" validation={ customProjectNameValidation(fields.name) || isValidAfterModified('name') }>
                  <FormLabel className="span-label">Name</FormLabel>
                  <FormInputElement name="name" type="text" value={ fields.name } />
                </FormElementWrapper>

                <FormElementWrapper size="full" name="description" className="text-left" validation={ isValidAfterModified('description') }>
                  <FormLabel className="span-label">Description</FormLabel>
                  <FormInputElement name="description" type="text" value={ fields.description } />
                </FormElementWrapper>
              <ButtonGroup>
                <Button buttonType="transparent" disabled={ progress } onClick={ back }>
                  Cancel
                </Button>
                <Button buttonType="primary" loading={ progress } onClick={ submit }>
                  Create Library Project
                </Button>
              </ButtonGroup>
            </React.Fragment>
          )
        }
      </SkedFormValidation>
    )
  }

  render() {
    const { renderNewLibraryForm } = this
    const { errorMsg } = this.state

    return (
      <ContentLayout centered>
        <h1>Create Library Project</h1>
        { errorMsg && <div className="callout warning">{ errorMsg }</div> }

        <div className="padding-top padding-bottom">
          { renderNewLibraryForm() }
        </div>
      </ContentLayout>
    )
  }
}
