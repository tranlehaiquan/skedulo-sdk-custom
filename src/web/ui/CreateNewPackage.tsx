import * as _ from 'lodash'
import * as React from 'react'
import * as fs from 'fs'
import * as util from 'util'
const readDirAsync = util.promisify(fs.readdir)

import { ContentLayout } from './Layout'
import { MainServices } from '../service-layer/MainServices'
import { SessionData } from '../service-layer/types'
import { ManagePackage } from './package/ManagePackage'
import { FormHelper } from './form-utils'
import { PackageService } from '../service-layer/package/PackageService'
import { Package } from '../service-layer/package/package-types.def'

export interface IProps {
  back: () => void
  session: SessionData
}

export interface IState {
  selectedPackage: PackageService | null,
  package: {
    selectedDirectory: string
  },
  packageMetadata: Package,
  errorMessage: string
}

export const NEW_PKG_METADATA = {
  version: '1' as Package['version'],
  name: '',
  summary: '',
  components: {},
  relationships: [],
  linkedComponents: []
}

export class CreateNewPackage extends React.PureComponent<IProps, IState> {
  private packageForm: FormHelper<IState['package']>
  private packageMetadataForm: FormHelper<IState['packageMetadata']>

  constructor(props: IProps) {
    super(props)

    this.state = {
      selectedPackage: null,
      package: {
        selectedDirectory: ''
      },
      packageMetadata: NEW_PKG_METADATA,
      errorMessage: ''
    }

    this.packageForm = new FormHelper(this.state.package, pkg => this.setState({ package: pkg }))
    this.packageMetadataForm = new FormHelper(this.state.packageMetadata, packageMetadata => this.setState({ packageMetadata }))
  }

  createNewPackage = () => {
    const { package: pkg, packageMetadata } = this.state
    const { selectedDirectory } = pkg

    PackageService.createPackage(selectedDirectory, packageMetadata)
    this.openNewPackage()
  }

  openNewPackage = () => {
    const { package: pkg } = this.state
    const { session } = this.props

    try {
      const newPackage = PackageService.at(pkg.selectedDirectory, session)
      this.setState({ selectedPackage: newPackage })

    } catch (e) {
      this.setState({ errorMessage: e.message })
    }
  }

  selectDirectory = async () => {
    const directoryResult = await MainServices.selectDirectory()
    const selectedPath = _.head(directoryResult.filePaths) || ''
    const files = await readDirAsync(selectedPath)
    const filteredFiles = files.filter(file => !file.startsWith('.')) // filter hidden system files

    try {
      if (!!filteredFiles.length) {
        this.setState({ errorMessage: 'The directory you have selected is not empty. Please select an empty directory.' })
      } else {
        this.packageForm.set('selectedDirectory', selectedPath)
        this.setState({ errorMessage: '' })
      }
    } catch (err) {
      this.setState({ errorMessage: err.message })
    }
  }

  render() {
    const { selectDirectory, packageMetadataForm, createNewPackage } = this
    const { package: pkg, packageMetadata, selectedPackage, errorMessage } = this.state // since package is a reserved word in strict mode

    return (
      selectedPackage ? (
        <ManagePackage package={ selectedPackage! } />
      ) : (
        <ContentLayout centered>
          <h1>Create New Package</h1>
          <div className="padding-top padding-bottom">
            <label className="required">
              <span className="span-label">Name</span>
              <input type="text" value={ packageMetadata.name } onChange={ packageMetadataForm.setMap('name') } onBlur={ packageMetadataForm.setMap('name') } />
            </label>
            <label className="required">
              <span className="span-label">Summary</span>
              <input type="text" value={ packageMetadata.summary } onChange={ packageMetadataForm.setMap('summary') } onBlur={ packageMetadataForm.setMap('summary') } />
            </label>
            <label>
              <span className="span-label">Directory</span>
              { errorMessage && <div className="callout warning">{ errorMessage }</div> }
              <input
                type="text"
                placeholder="Select package directory"
                onChange={ _.noop }
                value={ pkg.selectedDirectory }
                onClick={ selectDirectory } />
            </label>
          </div>

          <button className="sk-button transparent" onClick={ this.props.back }>Cancel</button>
          <button
            className="sk-button primary"
            onClick={ createNewPackage }
            disabled={ !(this.packageForm.isValid() && packageMetadataForm.isValid()) }>
              Create New Package
          </button>
        </ContentLayout>
      )
    )
  }
}
