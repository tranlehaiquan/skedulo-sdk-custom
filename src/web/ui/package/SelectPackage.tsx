import * as _ from 'lodash'
import * as React from 'react'
import { SelectedPackage } from '@skedulo/sked-commons'

import { MainServices } from '../../service-layer/MainServices'
import { SessionData } from '../../service-layer/types'
import { ContentLayout } from '../Layout'
import { PackageService } from '../../service-layer/package/PackageService'
import { ManagePackage } from './ManagePackage'
import { View } from '../App'

interface Props {
  back: () => void
  session: SessionData
  packageService: PackageService | null
  setView: (view: View) => () => void
  setPackage: (pkgDirectory: SelectedPackage['directory']) => void
}

interface State {
  selectedDirectory: string | null
  errorMessage: string | null
}

export class SelectPackage extends React.PureComponent<Props, State> {

  constructor(props: Props) {
    super(props)

    props.setPackage('')
  }

  state: State = {
    selectedDirectory: null,
    errorMessage: null
  }

  selectDirectory = () => {
    MainServices.selectDirectory().then(({ filePaths }) => {
      this.setState({ selectedDirectory: _.head(filePaths) || null })
    })
  }

  openPackage = () => {
    const { selectedDirectory } = this.state
    const { setPackage } = this.props

    if (selectedDirectory) {
      try {
        setPackage(selectedDirectory)
      } catch (e) {
        this.setState({ errorMessage: e.message })
      }
    }
  }

  render() {
    const { setView, packageService } = this.props

    return packageService
      ? (<ManagePackage package={ packageService! } setView={ setView } />)
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
