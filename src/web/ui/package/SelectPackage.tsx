import * as _ from 'lodash'
import * as React from 'react'

import { MainServices } from '../../service-layer/MainServices'
import { SessionData } from '../../service-layer/types'
import { ContentLayout } from '../Layout'
import { ButtonGroup, Button } from '@skedulo/sked-ui'

interface Props {
  back: () => void
  session: SessionData
  setPackage: (pkgDirectory: string) => Promise<void>
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

  openPackage = async () => {
    const { selectedDirectory } = this.state
    const { setPackage } = this.props

    if (selectedDirectory) {
      try {
        await setPackage(selectedDirectory)
      } catch (e: any) {
        this.setState({ errorMessage: e.message })
      }
    }
  }

  render() {
    return (
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

        <ButtonGroup>
          <Button buttonType="transparent" onClick={ this.props.back }>Cancel</Button>
          <Button
            buttonType="primary"
            onClick={ this.openPackage }
            disabled={ !this.state.selectedDirectory }>
            Open Package
          </Button>
        </ButtonGroup>
      </ContentLayout>
    )
  }
}
