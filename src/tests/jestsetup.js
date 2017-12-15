
/**
 * Global Shims
 */
global.requestAnimationFrame = (cb) => {
  setTimeout(cb, 0)
}

/**
 * Jest / Enzyme Setup Code
 */
const Adapter = require('enzyme-adapter-react-16')
const Enzyme = require('enzyme')

const adapter = new Adapter()

// React 16 enzyme adapter
Enzyme.configure({ adapter })
