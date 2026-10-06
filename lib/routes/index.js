// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { Router } = require('express')
const express = require('express')
const router = new Router()

const HttpError = require('../error/HttpError')
const StaticFileRegistry = require('../StaticFileRegistry')
const WorkspaceRegistry = require('../WorkspaceRegistry')

const MAX_UPLOAD_SIZE = '256mb'

/*
The request's content type is stored as the file's mime type,
so parse every body as raw bytes regardless of it
*/
router.post(
  '/workspaces/:workspace/files',
  express.raw({ type: () => true, limit: MAX_UPLOAD_SIZE }),
  async (req, res, next) => {
    const workspace = WorkspaceRegistry.getInstance().get(req.params.workspace)
    if (!workspace) {
      return next(new HttpError('Workspace not found', 'ERR_WORKSPACE_NOT_FOUND', 404))
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return next(new HttpError('The request body must contain the file', 'ERR_INVALID_BODY', 400))
    }

    const type = req.headers['content-type']?.split(';')[0].trim()

    try {
      const file = await workspace.api.files.upload(req.body, type)
      res.status(201).json(file)
    } catch (err) {
      if (err.code?.startsWith('ERR_API_FILES_')) {
        return next(new HttpError(err.message, err.code, 400))
      }
      next(err)
    }
  }
)

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
