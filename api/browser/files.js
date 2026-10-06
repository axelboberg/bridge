// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const Files = require('../shared/files')

class BrowserFiles extends Files {
  /**
   * Upload through the REST endpoint
   * @see Files#upload
   */
  async upload (data, type) {
    const { body, type: _type } = this.normalizeUpload(data, type)

    const res = await fetch(`/api/v1/workspaces/${encodeURIComponent(window.APP.workspace)}/files`, {
      method: 'POST',
      headers: { 'Content-Type': _type || 'application/octet-stream' },
      body
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(json.description || `Upload failed with status ${res.status}`)
    }
    return json
  }
}

DIController.main.register('Files', BrowserFiles, [
  'Commands'
])
