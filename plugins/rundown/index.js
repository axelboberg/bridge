/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const manifest = require('./manifest.json')
const assets = require('../../assets.json')

const bridge = require('bridge')
const fs = require('fs')

class RundownComponent {
  get name () {
    return 'Rundown'
  }

  getHtml () {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="/${assets.hash}.${manifest.bundle}.bundle.js" defer></script>
          <link rel="stylesheet" href="/${assets.hash}.${manifest.bundle}.bundle.css" />
        </head>
        <body>
          <div id="root">
        </body>
      </html>
    `
  }
}

exports.activate = () => {
  console.log('Activated plugin in worker', bridge)
  /*
    context.component.register('rundown', new RundownComponent())
    const url = context.file.serve(`/dist/${assets.hash}.${context.manifest.bundle}.bundle.js`)
    console.log(url)
  */
}
