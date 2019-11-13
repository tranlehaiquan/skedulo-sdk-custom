import * as _ from 'lodash'
import * as React from 'react'

import { MainServices } from '../../service-layer/MainServices'
import { SessionData } from '../../service-layer/types'
import { ContentLayout } from '../Layout'
import { SelectedPackage } from '../../service-layer/package/package-types.def'
import { PackageService } from '../../service-layer/package/PackageService'
import { ManagePackage } from './ManagePackage'
import { View } from '../App'

interface Props {
  back: () => void
  session: SessionData
  setView: (view: View) => () => void
  setPackage: (pkgDirectory: SelectedPackage['directory'], pkgMetaData: SelectedPackage['metaData']) => void
}

interface State {
  selectedDirectory: string | null
  selectedPackage: PackageService | null
  errorMessage: string | null
}

export class SelectPackage extends React.PureComponent<Props, State> {

  state: State = {
    selectedDirectory: null,
    selectedPackage: null,
    errorMessage: null
  }

  selectDirectory = async () => {
    const directoryResult = await MainServices.selectDirectory()

    this.setState({
      selectedDirectory: _.head(directoryResult.filePaths) || null
    })
  }

  openPackage = () => {
    const { selectedDirectory } = this.state
    const { session, setPackage } = this.props

    if (selectedDirectory) {
      try {
        const pkg = PackageService.at(selectedDirectory, session)
        this.setState({ selectedPackage: pkg })
        setPackage(selectedDirectory, pkg.packageMetadata)

      } catch (e) {
        this.setState({ errorMessage: e.message })
      }
    }
  }

  render() {
    const { setView } = this.props

    return this.state.selectedPackage
      ? (<ManagePackage package={ this.state.selectedPackage! } setView={ setView } />)
      : (
        <ContentLayout centered>

          <h1>Select Package</h1>
          <p>Select a directory with an existing package or select an empty directory to create a new project</p>

          <div className="padding-top padding-bottom">
              <span className="span-label">Package directory</span>
            <label>
              { this.state.errorMessage && <div className="callout warning">{ this.state.errorMessage }</div> }
              <input type="text" placeholder="Select package" value={ this.state.selectedDirectory || '' } onChange={ _.noop } onClick={ this.selectDirectory } />
            </label>
          </div>

          <button className="sk-button transparent" onClick={ this.props.back }>Cancel</button>

          <button
            className="sk-button primary"
            onClick={ this.openPackage }
            disabled={ !this.state.selectedDirectory }>
            Open Package</button>

        </ContentLayout>
      )
  }
}
