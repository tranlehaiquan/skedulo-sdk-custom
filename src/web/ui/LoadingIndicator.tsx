import * as React from 'react'
import * as classnames from 'classnames'

export interface IProps {
  className?: string
  overlayClassName?: string
  withOverlay?: boolean
}

export class LoadingIndicator extends React.PureComponent<IProps> {

  static defaultProps = {
    withOverlay: false
  }

  renderIndicator = () => {
    const indicatorClasses = classnames('sk-loader-large center-in-panel', this.props.className)

    return (
      <div className={ indicatorClasses }>
        <div className="shrink-grow circle-1" />
        <div className="shrink-grow circle-2" />
      </div>
    )
  }

  render() {
    const { overlayClassName, withOverlay } = this.props
    const { renderIndicator } = this

    const overlayClasses = classnames('overlay', overlayClassName)

    return withOverlay
      ? (
        <div className={ overlayClasses }>
          { renderIndicator() }
        </div>
      )
      : renderIndicator()
  }
}
