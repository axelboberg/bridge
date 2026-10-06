// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const environment = require('./shared/environment')

;(function () {
  if (environment.isNode()) {
    require('./node/files')
    return
  }
  if (environment.isBrowser()) {
    require('./browser/files')
  }
})()
