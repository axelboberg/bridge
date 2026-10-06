// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const crypto = require('crypto')

class StaticFileRegistry {
  /**
   * Get the singleton
   * instance of this class
   * @returns { StaticFileRegistry }
   */
  static getInstance () {
    if (!this._instance) this._instance = new StaticFileRegistry()
    return this._instance
  }

  constructor () {
    /**
     * @private
     */
    this._map = new Map()

    /**
     * @private
     */
    this._types = new Map()
  }

  /**
   * Get the content type of a served file
   * @param { String } id
   * @returns { String? }
   */
  getType (id) {
    return this._types.get(id)
  }

  /**
   * Get a read stream
   * for a file with an id
   * @param { String } id
   * @returns { ReadableStream }
   */
  createReadStream (id) {
    const path = this._map.get(id)
    if (!path) return

    return fs.createReadStream(path)
  }

  /**
   * Start serving the file at an absolute path
   * @param { import('fs').PathLike } path
   * @param { String= } type A content type to serve the file as
   * @returns { String } An identifier for the file
   */
  serve (path, type) {
    const hash = crypto.createHash('sha256')
    const id = hash.update(path).digest('hex')

    this._map.set(id, path)
    if (type) this._types.set(id, type)
    return id
  }

  /**
   * Remove a file by its id
   * from the registry
   * @param { String } id
   * @returns { Boolean }
   */
  remove (id) {
    this._map.delete(id)
    this._types.delete(id)
  }
}
module.exports = StaticFileRegistry
