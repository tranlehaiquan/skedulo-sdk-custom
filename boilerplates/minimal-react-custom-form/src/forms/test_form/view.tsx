import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

// Import sass styles
import '../../stylesheets/sass/skedulo-mobile.scss'

export type SaveCallBack = (changeSet: any, mainTree: any, preventNavBack?: boolean, formValid?: boolean) => void

// tslint:disable:no-console
export default function wrapper(contextId: string, saveCallback: SaveCallBack, widgets: any, onLoadCallback = () => console.info('--> View Ready <--')) {
  return (formData: { main: any, common: any }) => {
    const { main, common } = formData

    ReactDOM.render(<App contextId={ contextId } main={ main } common={ common } saveCallback={ saveCallback } widgets={ widgets } />,
      document.getElementById('root'), () => {
        onLoadCallback()
      })
  }
}
