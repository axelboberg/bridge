// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const Files = require('../shared/files')
const random = require('../random')

class ClientFiles extends Files {
  /**
   * Upload through the REST endpoint
   *
   * Progress is reported through 'file.upload.progress'
   * events carrying the uploadId, pass your own
   * to correlate them with this upload
   * @see Files#upload
   * @param { Blob | ArrayBuffer | Uint8Array | String } data
   * @param { String= } type
   * @param {{ uploadId: String= }=} opts Set uploadId to correlate progress events
   */
  async upload (data, type, { uploadId = random.string(16) } = {}) {
    const { body, type: _type } = this.normalizeUpload(data, type)

    const message = this.props.Messages.createProgressMessage({ text: 'Uploading file' })
    const onProgress = p => {
      if (p?.uploadId !== uploadId || !p.total) {
        return
      }
      message.update({ progress: p.loaded / p.total })
    }
    await this.props.Events.on('file.upload.progress', onProgress)

    try {
      const res = await fetch(`/api/v1/workspaces/${encodeURIComponent(window.APP.workspace)}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': _type || 'application/octet-stream',
          'X-Upload-Id': uploadId
        },
        body
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(json.description || `Upload failed with status ${res.status}`)
      }
      message.finish()
      return json
    } catch (err) {
      message.dismiss()
      throw err
    } finally {
      this.props.Events.off('file.upload.progress', onProgress)
    }
  }
}

DIController.main.register('Files', ClientFiles, [
  'Commands',
  'Events',
  'Messages'
])
