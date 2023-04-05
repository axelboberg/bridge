// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  registerType: registerType,
 *  removeType: removeType
 * }} ShortcutsApi
 */

const Validator = require('../Validator')

/**
 * A factory function
 * for the shortcuts API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { ShortcutsApi }
   */
  api.shortcuts = {}

  /**
   * Register a type by
   * its specification
   * @param { ShortcutSpecification } specification A shortcut specification
   * @returns { Promise.<Boolean> }
   */
  function registerShortcut (specification) {
    const validate = Validator.getShortcutValidator()
    const isValid = validate(specification)

    if (!isValid) {
      throw Validator.getFirstError(validate)
    }

    workspace.state.apply({
      _shortcuts: {
        [specification.id]: {
          ...specification
        }
      }
    })
    return true
  }
  api.shortcuts.registerShortcut = registerShortcut
  api.commands.registerAsyncCommand('shortcuts.registerShortcut', registerShortcut)
}
exports.factory = factory
