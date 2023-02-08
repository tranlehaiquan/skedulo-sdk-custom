import * as path from 'path'

export const WEB_BASE_PATH = path.join(
  require('@electron/remote').app.getAppPath(),
  process.env.NODE_ENV === 'development' ? '/app' : ''
)
