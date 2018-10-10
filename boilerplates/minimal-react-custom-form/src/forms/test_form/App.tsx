import React from 'react'
import Header from './components/Header'
import { SaveCallBack } from './view'

interface Props {
  contextId: string
  main: { job: any, jobId: any }
  common: any
  saveCallback: SaveCallBack
  widgets: any
}

export default class App extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)
  }

  render() {
    return (
      <div>
        <Header onSave={ () => this.saveFn } onBack={ () => this.goBack } title="Blank Form" />
        { JSON.stringify(this.props.main.job) }
      </div>
    )
  }

  goBack() {
    (window as any).navGoBack()
  }

  saveFn() {
    const { contextId } = this.props

    this.props.saveCallback({ jobId: contextId }, { jobId: contextId }, false, true)
  }
}
