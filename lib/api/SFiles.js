// SPDX-FileCopyrightText: 2026 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const ApiError = require('../error/ApiError')
const { hashContents } = require('../workspace/WorkspaceFiles')

const MIME_TYPE_REGEX = /^[\w.+-]+\/[\w.+-]+$/

/**
 * @typedef {{
 *  id: String,
 *  type: String,
 *  size: Number
 * }} File
 */

class SFiles extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('files.list', this.list.bind(this))
    this.props.SCommands.registerAsyncCommand('files.get', this.get.bind(this))
    this.props.SCommands.registerAsyncCommand('files.read', this.read.bind(this))
    this.props.SCommands.registerAsyncCommand('files.delete', this.delete.bind(this))
    this.props.SCommands.registerAsyncCommand('files.upload', this.upload.bind(this))
  }

  /**
   * List the files stored in the project file
   * @returns { Promise.<File[]> }
   */
  async list () {
    return this.props.Workspace.files.list()
  }

  /**
   * Get a file's metadata
   * @param { String } id
   * @returns { Promise.<File?> }
   */
  async get (id) {
    return this.props.Workspace.files.get(id)
  }

  /**
   * Read a file's contents
   * @param { String } id
   * @returns { Promise.<String> } The contents, base64 encoded
   */
  async read (id) {
    if (!this.props.Workspace.files.get(id)) {
      throw new ApiError('No file with the given id exists', 'ERR_API_FILES_NOT_FOUND')
    }
    const data = await this.props.Workspace.files.read(id)
    return data.toString('base64')
  }

  /**
   * Delete a file
   * @param { String } id
   * @returns { Promise.<Boolean> } True if a file was deleted
   */
  async delete (id) {
    const removed = await this.props.Workspace.files.remove(id)
    if (removed) {
      this.props.Workspace.state.markAsUnsaved()
      this.props.SEvents.emit('files.changed', { action: 'delete', id })
    }
    return removed
  }

  /**
   * Store a file in the project file,
   * identical contents are only stored once
   *
   * Browser clients should upload through the
   * REST endpoint instead, as this command
   * requires binary data to be transferable
   *
   * @param { Uint8Array } data The contents
   * @param { String= } type A mime type
   * @returns { Promise.<File> }
   */
  async upload (data, type) {
    if (!(data instanceof Uint8Array)) {
      throw new ApiError('File data must be a Uint8Array', 'ERR_API_FILES_INVALID_DATA')
    }
    if (type != null && (typeof type !== 'string' || !MIME_TYPE_REGEX.test(type))) {
      throw new ApiError('The file type must be a valid mime type', 'ERR_API_FILES_INVALID_TYPE')
    }

    const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    const isNew = !this.props.Workspace.files.get(hashContents(buffer))
    const file = await this.props.Workspace.files.add(buffer, type)
    if (isNew) {
      this.props.Workspace.state.markAsUnsaved()
      this.props.SEvents.emit('files.changed', { action: 'upload', id: file.id })
    }
    return file
  }
}

DIController.main.register('SFiles', SFiles, [
  'Workspace',
  'SCommands',
  'SEvents'
])
