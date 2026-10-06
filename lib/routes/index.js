// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { Router } = require('express')
const router = new Router()

const HttpError = require('../error/HttpError')
const StaticFileRegistry = require('../StaticFileRegistry')
const WorkspaceRegistry = require('../WorkspaceRegistry')

const UPLOAD_ID_REGEX = /^[\w-]{1,64}$/

/*
The request's content type is stored as the file's mime type,
the body is streamed so that progress can be reported
*/
router.post('/workspaces/:workspace/files', async (req, res, next) => {
  const workspace = WorkspaceRegistry.getInstance().get(req.params.workspace)
  if (!workspace) {
    return next(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404))
  }

  const type = req.headers['content-type']?.split(';')[0].trim()
  const uploadId = req.headers['x-upload-id']

  try {
    const file = await workspace.api.files.uploadStream(req, {
      type,
      uploadId: UPLOAD_ID_REGEX.test(uploadId) ? uploadId : undefined,
      total: parseInt(req.headers['content-length'], 10)
    })
    res.status(201).json(file)
  } catch (err) {
    if (err.code === 'ERR_API_FILES_TOO_LARGE') {
      return next(new HttpError(err.message, err.code, 413))
    }
    if (err.code?.startsWith('ERR_API_FILES_')) {
      return next(new HttpError(err.message, err.code, 400))
    }
    next(err)
  }
})

router.get('/serve/:id', (req, res, next) => {
  const stream = StaticFileRegistry.getInstance().createReadStream(req.params.id)
  if (!stream) {
    const err = new HttpError('File not found', 'ERR_NOT_FOUND', '404')
    return next(err)
  }
  const type = StaticFileRegistry.getInstance().getType(req.params.id)
  if (type) {
    res.type(type)
    res.set('X-Content-Type-Options', 'nosniff')
  }
  stream.pipe(res)
})

module.exports = router
