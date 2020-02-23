import * as _ from 'lodash'
import * as React from 'react'
import * as path from 'path'
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
import { Lens, Option } from '@skedulo/sked-commons'
import {
  LibraryProject,
  Package,
  ProjectType
} from '@skedulo/packaging-internal-commons'
import { ContentLayout } from '../Layout'
import { FormHelper } from '../form-utils'
import { PackageService } from '../../service-layer/package/PackageService'
import { LibraryProjectService } from '../../service-layer/package/LibraryProjectService'
import { LegacyProjectServices } from '../../service-layer/LegacyProjectServices'
import { registerNodeDependencyLink } from '../../service-layer/package/dependency-utils'

export interface IProps {
  back: () => void
  selectedPackage: PackageService
  refreshPackage: (goToConfiguration: boolean) => void
}

export interface IState {
  progress: boolean
  errorMsg: string
  projectMetadata: LibraryProject
}

interface LibraryProjectForm {
  name: string
  description: string
}

export const NEW_LIBRARY_PRJ_METADATA: LibraryProject = {
  type: ProjectType.Library,
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

export class NewLibraryProject extends React.PureComponent<IProps, IState> {
  private projectMetadataForm: FormHelper<IState['projectMetadata']>

  constructor(props: IProps) {
    super(props)

    this.state = {
      progress: false,
      errorMsg: '',
      projectMetadata: NEW_LIBRARY_PRJ_METADATA
    }

    this.projectMetadataForm = new FormHelper(this.state.projectMetadata, projectMetadata => this.setState({ projectMetadata }))
  }

  getUpdatedPackageMetadata = () => {
    const { selectedPackage } = this.props
    const { projectMetadata } = this.state

    const metadata = selectedPackage.packageMetadata
    const { items }= Option.of(metadata.components.libraries).getOrElse({ items: [] }) as { items: string[] }

    return Lens('components', 'libraries', 'items').over(_items => [ ...items, projectMetadata.name ])(metadata) as Package
  }

  createProject = () => {
    const { getUpdatedPackageMetadata } = this
    const { selectedPackage, refreshPackage } = this.props
    const { projectMetadata } = this.state

    const pkgDirectory = selectedPackage.packagePath

    this.setState({ progress: true })

    try {
      return LibraryProjectService
        // TODO Jess: Pull in boilerplates from boilerplate project on build and remove link to Legacy Services!  
        .create(pkgDirectory, projectMetadata.name, LegacyProjectServices.getLibraryProjectTemplate().path, projectMetadata, {} as any)
        .then(async () => {
          // Update the package metadata file
          PackageService.createPackageMetadata(pkgDirectory, getUpdatedPackageMetadata())

          // Register the library for linking
          await registerNodeDependencyLink([path.join(pkgDirectory, projectMetadata.name)])

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

  updateAndValidateField = (fieldName: 'name' | 'description', fieldUpdate: SkedFormChildren<FormConfig>['customFieldUpdate']) => (e: React.FormEvent<HTMLInputElement>) => {
    this.projectMetadataForm.setMap(fieldName)(e)
    fieldUpdate(fieldName)(e.currentTarget.value)
  }

  renderNewLibraryForm = () => {
    const { projectMetadataForm, updateAndValidateField, createProject } = this
    const { projectMetadata, progress } = this.state
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
              <ButtonGroup className="sk-button-group">
                <Button buttonType="transparent" onClick={ back }>
                  Cancel
                  </Button>
                <Button buttonType="primary" onClick={ submit }>
                  { progress ? 'Creating Project. Please wait...' : 'Create Library Project' }
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
