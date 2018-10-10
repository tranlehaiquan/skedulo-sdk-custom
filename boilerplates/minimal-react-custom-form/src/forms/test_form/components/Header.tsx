import React from 'react'

interface Props {
  title: string
  onSave: () => void
  onBack: () => void
}

export default class Header extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props)

    this.props = props
  }

  render() {
    return (
      <header className="bar-title">
          <button className="btn transparent fl" onClick={ this.goBack }>
              <i className="sk sk-chevron-left" />
          </button>

          <h1 className="title"><span>{ this.props.title }</span></h1>

          <button className="btn transparent fr" onClick={ this.saveFn }>
              Save
          </button>
      </header>
    )
  }

  goBack = () => {
    this.props.onBack()
  }

  saveFn = () => {
    this.props.onSave()
  }
}
