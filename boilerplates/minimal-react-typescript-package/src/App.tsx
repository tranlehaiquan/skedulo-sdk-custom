
import * as React from 'react'
const logo = require('./logo.svg')

import { Services } from './Services/Services'
import { Job, DataServices } from './Services/DataServices'

interface AppState {
  loading: boolean
  data: Job[]
}

export class App extends React.PureComponent<{}, AppState> {

  private _dataService = new DataServices(Services)

  constructor(props: {}) {
    super(props)

    this.state = {
      loading: false,
      data: []
    }
  }

  async componentDidMount() {

    this.setState({ loading: true })

    try {
      const jobs = await this._dataService.fetchJobs()
      this.setState({ data: jobs })
    } finally {
      this.setState({ loading: false })
    }
  }

  renderTableOfData = (data: AppState['data']) => {

    return (
      <table>
        <tbody>
          { data.map(d => (<tr key={ d.UID }><td>{ d.Name }</td><td>{ d.Description }</td></tr>)) }
        </tbody>
      </table>
    )
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={ logo } className="App-logo" alt="logo" />
        </div>
        <p className="App-intro">
          To get started, open this project in a code-editor and edit <code>src/App.tsx</code>.
        </p>
        <p>
          Start by adding or editing the queries from DataServices.ts and render them appropriately.
        </p>

        <hr />
        <h4>Sample GraphQL Query: Fetching Jobs List</h4>

        { this.state.loading ? 'Loading ...' : this.renderTableOfData(this.state.data) }
      </div>
    )
  }
}
