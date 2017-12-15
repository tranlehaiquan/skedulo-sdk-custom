import * as path from 'path'

import { app } from 'electron'

export const BASE_PATH = path.join(
  app.getAppPath(),
  process.env.NODE_ENV === 'development' ? '/app' : ''
)
