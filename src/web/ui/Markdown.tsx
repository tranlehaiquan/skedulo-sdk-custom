import * as React from 'react'
import * as fs from 'fs'
import * as marked from 'marked'
import * as hljs from 'highlight.js'
import { clipboard } from 'electron'

const renderer = new marked.Renderer()
renderer.code = (code, language) => {
  return `<pre><button data-copytext="${code}" class="copy-to-clipboard-js">Copy</button><code class="hljs ${language}">${hljs.highlight(language, code).value}</code></pre>`
}

export interface IProps {
  fileLocation: string
}

export class Markdown extends React.PureComponent<IProps> {

  markDown: string

  constructor(props: IProps) {
    super(props)
    this.markDown = fs.readFileSync(props.fileLocation, 'utf-8')
  }

  copyToClipboard = (event: React.SyntheticEvent<HTMLDivElement>) => {
    event.persist()
    const target = event.currentTarget

    if (target.className.includes('copy-to-clipboard-js')) {

      const text = target.dataset.copytext || ''
      clipboard.writeText(text)

      const originalButtonText = target.innerHTML
      target.innerHTML = 'Copied!'

      setTimeout(() => {
        target.innerHTML = originalButtonText
      }, 1000)

    }
  }

  render() {
    return (
      <div onClick={ this.copyToClipboard } dangerouslySetInnerHTML={ { __html: marked(this.markDown, { renderer }) } } />
    )
  }
}
