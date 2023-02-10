import * as React from 'react'
import * as _ from 'lodash'
import * as fs from 'fs'
import * as util from 'util'
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
import { Package, Version } from '@skedulo/packaging-internal-commons'
import { ContentLayout } from '../Layout'
import { MainServices } from '../../service-layer/MainServices'
import { SessionData } from '../../service-layer/types'
import { FormHelper } from '../form-utils'
import { PackageService } from '../../service-layer/package/PackageService'

const readDirAsync = util.promisify(fs.readdir)

export interface IProps {
  back: () => void
  session: SessionData
  setPackage: (pkgDirectory: string) => void
}

export interface IState {
  package: {
    selectedDirectory: string
  },
  packageMetadata: Package,
  errorMessage: string
}

interface PackageForm {
  name: string,
  summary: string,
  directory: string
}

export const NEW_PKG_METADATA: Package = {
  version: Version.One,
  name: '',
  summary: '',
  components: {}
}

const FORM_CONFIG: FormConfig = {
  name: {
    isRequired: {
      message: 'Please enter a package name'
    },
    isRegexMatch: {
      regex: /^[a-z0-9]+$/i,
      message: 'Please enter a valid alpha-numeric package name'
    } as any
  },
  summary: {
    isRequired: {
      message: 'Please enter a package summary'
    }
  },
  directory: {
    isRequired: {
      message: 'The directory you have selected is not empty. Please select an empty directory.'
    }
  }
}

export class CreateNewPackage extends React.PureComponent<IProps, IState> {
  private packageForm: FormHelper<IState['package']>
  private packageMetadataForm: FormHelper<IState['packageMetadata']>

  constructor(props: IProps) {
    super(props)

    this.state = {
      package: {
        selectedDirectory: ''
      },
      packageMetadata: NEW_PKG_METADATA,
      errorMessage: ''
    }

    this.packageForm = new FormHelper(this.state.package, pkg => this.setState({ package: pkg }))
    this.packageMetadataForm = new FormHelper(this.state.packageMetadata, packageMetadata => this.setState({ packageMetadata }))
    props.setPackage('')
  }

  createNewPackage = () => {
    const { package: pkg, packageMetadata } = this.state
    const { selectedDirectory } = pkg

    PackageService.createPackageMetadata(selectedDirectory, packageMetadata)
    this.openNewPackage()
  }

  openNewPackage = () => {
    const { package: pkg } = this.state
    const { setPackage } = this.props

    try {
      setPackage(pkg.selectedDirectory)
    } catch (e: any) {
      this.setState({ errorMessage: e.message })
    }
  }

  selectDirectory = (fieldUpdate: SkedFormChildren<PackageForm>['customFieldUpdate']) => async () => {
    const { setAndValidateDirectory } = this
    const directoryResult = await MainServices.selectDirectory()
    const selectedPath = _.head(directoryResult.filePaths) || ''
    const files = await readDirAsync(selectedPath)
    const filteredFiles = files.filter(file => !file.startsWith('.')) // filter hidden system files

    try {
      if (!filteredFiles.length) {
        setAndValidateDirectory(fieldUpdate, selectedPath)
      } else {
        setAndValidateDirectory(fieldUpdate, '')
      }
    } catch (err: any) {
      throw new Error(err.message)
    }
  }

  setAndValidateDirectory = (fieldUpdate: SkedFormChildren<PackageForm>['customFieldUpdate'], selectedPath: string) => {
    this.packageForm.set('selectedDirectory', selectedPath)
    fieldUpdate('directory')(selectedPath)
  }

  updateAndValidateField = (fieldName: 'name' | 'summary', fieldUpdate: SkedFormChildren<PackageForm>['customFieldUpdate']) => (e: React.FormEvent<HTMLInputElement>) => {
    this.packageMetadataForm.setMap(fieldName)(e)
    fieldUpdate(fieldName)(e.currentTarget.value)
  }

  renderNewPackageForm = () => {
    const { packageMetadataForm, selectDirectory, updateAndValidateField, createNewPackage } = this
    const { packageMetadata, package: pkg } = this.state
    const { back } = this.props
    const initialFormValues: PackageForm = {
      name: '',
      summary: '',
      directory: ''
    }

    return (
      <SkedFormValidation
        config={ FORM_CONFIG }
        initialValues={ initialFormValues }
        onSubmit={ createNewPackage }
      >
        {
          ({ isValidAfterModified, customFieldUpdate, submit }) => {
            return (
              <React.Fragment>
                <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('name') }>
                  <FormLabel className="span-label">Name</FormLabel>
                  <FormInputElement type="text" value={ packageMetadata.name } onChange={ updateAndValidateField('name', customFieldUpdate) } onBlur={ packageMetadataForm.setMap('name') } />
                </FormElementWrapper>

                <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('summary') }>
                  <FormLabel className="span-label">Summary</FormLabel>
                  <FormInputElement type="text" value={ packageMetadata.summary } onChange={ updateAndValidateField('summary', customFieldUpdate) } onBlur={ packageMetadataForm.setMap('summary') } />
                </FormElementWrapper>

                <FormElementWrapper size="full" className="text-left" validation={ isValidAfterModified('directory') }>
                  <FormLabel className="span-label">Directory</FormLabel>
                  <FormInputElement type="text" placeholder="Select package directory" value={ pkg.selectedDirectory } onClick={ selectDirectory(customFieldUpdate) } />
                </FormElementWrapper>

                <ButtonGroup className="sk-button-group">
                  <Button buttonType="transparent" onClick={ back }>
                    Cancel
                  </Button>
                  <Button buttonType="primary" onClick={ submit }>
                    Create New Package
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
    const { renderNewPackageForm } = this

    return (
      <ContentLayout centered>
        <h1>Create New Package</h1>
        <div className="padding-top padding-bottom">
          { renderNewPackageForm() }
        </div>
      </ContentLayout>
    )
  }
}
