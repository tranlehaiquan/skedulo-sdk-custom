import * as _ from 'lodash'
import * as React from 'react'

import { MainServices } from '../service-layer/MainServices'
import { ContentLayout } from './Layout'

export interface IProps {
  back: () => void
  selectProject: (project: string) => void,
  errorMessage?: string
}

export interface IState {
  selectedDirectory: string | null
}

export class SelectProject extends React.PureComponent<IProps, IState> {

  constructor(props: IProps) {
    super(props)

    this.state = {
      selectedDirectory: null
    }
  }

  selectDirectory = () => {

    this.setState({
      selectedDirectory: _.head(MainServices.selectDirectory()) || null
    })
  }

  openProject = () => {
    this.props.selectProject(this.state.selectedDirectory!)
  }

  render() {
    return (
      <ContentLayout centered>

        <h1>Select a project</h1>
        <div className="padding-top padding-bottom">
          <label>
            <span className="span-label">Project/s</span>
            { this.props.errorMessage &&
              <div className="callout warning">
                { this.props.errorMessage }
              </div>
            }
            <input type="text" placeholder="Select project" value={ this.state.selectedDirectory || '' } onClick={ this.selectDirectory } />
          </label>
        </div>

        <button className="sk-button transparent" onClick={ this.props.back }>Cancel</button>

        <button
          className="sk-button primary"
          onClick={ this.openProject }
          disabled={ !this.state.selectedDirectory }>
          Open project</button>

        { /* <hr />
        <h2>Recent projects</h2>
        <div>List recently opened projects here ...</div> */ }

      </ContentLayout>
    )
  }
}
