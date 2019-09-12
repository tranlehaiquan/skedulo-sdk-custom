
/**
 * Restart `yarn dev` after making changes to this file.
 * Changes need to be copied across to the app folder correctly
 */

const path = require('path')
const packageJSON = require(path.join(process.cwd(), '/', 'package.json'))

if(!packageJSON || !packageJSON.main) {
  throw new Error('package.json missing or `main` not defined')
}

const app = require(path.join(process.cwd(),'/', packageJSON.main))

process.send(JSON.stringify({ type: 'init' }))

async function handleRequest(method, path, headers, body) {
  try {
    const response = await app.handler(method, path, headers, body)
    process.send(JSON.stringify({ type: 'response', data: response }))
  } catch (e) {
    console.log("messagehere", e)
    process.send(JSON.stringify({ type: 'error', data: e.message }))
  }
}

process.on('message', msg => {

  const event = JSON.parse(msg)

  switch (event.type) {
    case 'request':
      // Data = FnPayload. Contains, method, body, querystring, headers, path
      const data = event.data
      handleRequest(data)
      break
    default:
      throw new Error('Invalid message type received in sked-function')
  }
})

// Keep node process alive
setTimeout(() => null, 1 << 30)
