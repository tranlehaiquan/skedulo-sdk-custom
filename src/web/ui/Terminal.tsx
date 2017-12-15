import * as React from 'react'
import { Observable, Subscription } from 'rxjs'

import { LogItem } from '../service-layer/ProjectServices'

export interface IProps {
  log$: Observable<LogItem>
}

export interface IState {
  logItems: JSX.Element[]
}

export class Terminal extends React.PureComponent<IProps, IState> {

  state: IState = {
    logItems: []
  }

  private subscription: Subscription

  componentWillReceiveProps(newProps: IProps) {

    if (newProps.log$ !== this.props.log$) {
      this.subscription.unsubscribe()
      this.subscription = this.startStream(newProps.log$)
    }
  }

  componentDidMount() {
    this.subscription = this.startStream(this.props.log$)
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  startStream(log$: IProps['log$']) {

    let i = 0
    this.setState({ logItems: [] })

    return log$
      .do(logItem => {
        this.setState({ logItems: [...this.state.logItems, this.processLogItem(logItem, i++)] })
      }, void 0)
      .subscribe()
  }

  processLogItem(item: LogItem, index: number) {
    switch (item.type) {
      case 'out':
        return <div key={ index } className="stdout">{ item.value }</div>
      case 'err':
        return <div key={ index } className="stderr">{ item.value }</div>
      default:
        throw new Error('Invalid Type')
    }
  }

  render() {
    return (
      <code className="small-12 column terminal">
        { this.state.logItems }
      </code>
    )
  }
}
