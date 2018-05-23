
import * as fs from 'fs'
import * as path from 'path'

import * as React from 'react'
import { WEB_BASE_PATH } from '../web-base-path'

export interface LocalImgProps {
  src: string
}

export class LocalImg extends React.PureComponent<LocalImgProps> {

  static VALID_EXTENSIONS = ['png', 'jpg', 'jpeg']

  render() {

    const filePath = path.join(WEB_BASE_PATH, '/assets/', this.props.src)

    // Verify extension and strip `.`
    let ext = path.extname(filePath)
    if (ext.length && ext[0] === '.') {
      ext = ext.substr(1)
    }

    if (!LocalImg.VALID_EXTENSIONS.includes(ext)) {
      return (
        <div>Invalid Image attached. Only png, jpg or jpeg files are supported.</div>
      )
    }

    const file = fs.readFileSync(filePath, 'base64')

    return (
      <img src={ `data:image/${ext};base64,` + file } />
    )
  }
}
