import * as React from 'react'
import { Observable, Subscription } from 'rxjs'

import { LogItem } from '../service-layer/ProjectServices'

export enum TerminalSize {
  FullViewHeight,
  HalfViewHeight
}

export interface IProps {
  log$: Observable<LogItem>
  size: TerminalSize
}

export interface IState {
  logItems: JSX.Element[]
}

export class Terminal extends React.PureComponent<IProps, IState> {

  state: IState = {
    logItems: []
  }

  private subscription: Subscription = new Subscription()
  private _codeElem?: HTMLDivElement

  componentDidMount() {
    this.subscription.add(this.startStream(this.props.log$))
  }

  componentWillReceiveProps(newProps: IProps) {

    if (newProps.log$ !== this.props.log$) {
      this.subscription.unsubscribe()
      this.subscription = new Subscription()
      this.subscription.add(this.startStream(newProps.log$))
    }
  }

  componentDidUpdate() {
    this._codeElem!.scrollTop = this._codeElem!.scrollHeight
  }

  componentWillUnmount() {
    this.subscription.unsubscribe()
  }

  setCodeRef = (elem: HTMLDivElement) => this._codeElem = elem

  startStream(log$: IProps['log$']) {

    let i = 0
    this.setState({ logItems: [] })

    return log$
      .do(logItem => {
        // We "slice" the log to only render the most recent 4000 items
        // The "key" to this function is actually always guaranteed to be unique
        // When the index goes higher than the 4000 item max, the "index" would still
        // be increasing incrementally
        const updatedLogItems = [...this.state.logItems, this.processLogItem(logItem, i++)]
        this.setState({ logItems: updatedLogItems.slice(-4000) })

      }, void 0)
      .subscribe()
  }

  processLogItem(item: LogItem, key: number) {
    switch (item.type) {
      case 'out':
        return <div key={ key } className="stdout">{ item.value }</div>
      case 'err':
        return <div key={ key } className="stderr">{ item.value }</div>
      default:
        throw new Error('Invalid Type')
    }
  }

  render() {
    const terminalSizeClass = this.props.size === TerminalSize.FullViewHeight ? 'terminal--full-height' : 'terminal--half-height'

    return (
      <code className={ `small-12 column terminal ${terminalSizeClass}` } ref={ this.setCodeRef }>
        { this.state.logItems }
      </code>
    )
  }
}
