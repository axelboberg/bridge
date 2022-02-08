/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 * @description An implementation of the communicator using postMessage to the
 *              parent port when running in a NodeJS worker thread
 */

const { parentPort } = require('worker_threads')

/**
 * @type { import('../transport').Communicator }
 */
module.exports = {
  onMessage: handler => parentPort.on('message', handler),
  send: msg => parentPort.postMessage(msg)
}