// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Rundown</title>
        <base href="/"></base>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)
  bridge.widgets.registerWidget({
    id: 'bridge.plugins.rundown',
    name: 'Rundown',
    uri: `${htmlPath}`,
    description: 'The default rundown'
  })
}

/**
 * Initiate the default settings
 * if no settings are set
 */
async function initSettings () {
  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          display: {
            notes: true,
            type: true,
            id: true
          },
          scrolling: {
            centered: true
          }
        }
      }
    }
  })
}

exports.activate = async () => {
  initWidget()
  initSettings()

  /**
   * Get the items of a rundown
   * by the rundown's id
   * @param { String } itemId The id of the item to get child items for
   * @returns { String[] }
   */
  async function getItems (itemId) {
    return await bridge.state.get(`items.${itemId}.children`) || []
  }

  /*
  Clean up any parent-child relations
  when an item is deleted
  */
  bridge.events.on('items.delete', async items => {
    const parents = {}
    for (const item of items) {
      if (item.children) {
        bridge.items.deleteItems(item.children)
      }

      const parent = item.parent
      if (!parent) {
        continue
      }

      if (!parents[parent]) {
        parents[parent] = [item.id]
      } else {
        parents[parent].push(item.id)
      }
    }

    for (const parent of Object.keys(parents)) {
      await removeItemsFromParent(parent, parents[parent])
    }
  })

  /**
   * Move an item to a new parent and index,
   * will clean up any current relations
   *
   * @param { String } newParentId The new parent to move the item to
   * @param { Number } newIndex The new index within the new parent
   * @param { String } itemId The item to move
   */
  async function moveItem (newParentId, newIndex, itemId) {
    const siblings = await getItems(newParentId)
    const item = await bridge.items.getItem(itemId)

    /*
    Remove the item from
    any current parent
    */
    if (item.parent !== newParentId) {
      await removeItemsFromParent(item.parent, [item.id])
    }

    /*
    If the new parent doesn't have any items,
    append the item to the end rather than
    inserting it at an index
    */
    if (siblings.length === 0) {
      return appendItem(newParentId, itemId)
    }

    const oldIndex = siblings.indexOf(itemId)
    const weightedNewIndex = oldIndex < newIndex && oldIndex > -1 ? newIndex - 1 : newIndex

    if (oldIndex === newIndex) {
      return
    }

    /*
    A list of patches to
    apply to the state,

    the first patch sets the new parent of
    the item to be the new rundown
    */
    const patches = [{
      items: {
        [itemId]: {
          parent: newParentId
        }
      }
    }]

    /*
    Only remove the old index if it
    is in the current rundown
    */
    if (oldIndex !== -1) {
      patches.push({
        items: {
          [newParentId]: {
            children: {
              [oldIndex]: { $delete: true }
            }
          }
        }
      })
    }

    /*
    Insert the item at the correct
    index in the new rundown
    */
    patches.push({
      items: {
        [newParentId]: {
          children: { $insert: itemId, $index: Math.max(0, weightedNewIndex) }
        }
      }
    })

    bridge.state.apply(patches)
  }
  bridge.commands.registerCommand('rundown.moveItem', moveItem)

  /**
   * Remove multiple items
   * from a parent item
   * @param { String } parentId
   * @param { String[] } itemIds
   */
  async function removeItemsFromParent (parentId, itemIds) {
    const items = await getItems(parentId)

    if (items.length === 0) {
      return
    }

    const set = new Set(itemIds)
    const newItems = items.filter(itemId => !set.has(itemId))

    bridge.state.apply({
      items: {
        [parentId]: {
          children: { $replace: newItems }
        }
      }
    })
  }
  bridge.commands.registerCommand('rundown.removeItem', (parentId, itemId) => removeItemsFromParent(parentId, [itemId]))
  bridge.commands.registerCommand('rundown.removeItems', removeItemsFromParent)

  /**
   * Create a serialised representation
   * of an array of items
   * @param { String[] } itemIds
   * @returns { Promise.<String> }
   */
  async function copyItems (itemIds) {
    async function copyItem (itemId) {
      const item = await bridge.items.getItem(itemId)
      const items = [item]
      for (const id of (item?.children || [])) {
        items.push(...(await copyItem(id)))
      }
      return items
    }

    const items = (await Promise.all(itemIds.map(id => copyItem(id))))
      .reduce((prev, cur) => {
        return [...prev, ...cur]
      }, [])

    return JSON.stringify(items)
  }
  bridge.commands.registerCommand('rundown.copyItems', copyItems)

  /**
   * Append an item to
   * a new parent, will remove any current relations
   * @param { String } newParentId
   * @param { String } itemId
   */
  async function appendItem (newParentId, itemId) {
    const items = await getItems(newParentId)
    const item = await bridge.items.getItem(itemId)

    if (item?.parent) {
      removeItemsFromParent(item.parent, [item.id])
    }

    const patches = []

    /*
    Update the item's parent-field to keep track
    of which rundown the item is added to for easier
    removal
    */
    patches.push({
      items: {
        [itemId]: {
          parent: newParentId
        }
      }
    })

    /*
    If there aren't already items in an array,
    make sure that the items-object is indeed
    an array, otherwise, append new items
    */
    if (items.length === 0) {
      patches.push({
        items: {
          [newParentId]: {
            children: [itemId]
          }
        }
      })
    } else {
      patches.push({
        items: {
          [newParentId]: {
            children: { $push: [itemId] }
          }
        }
      })
    }
    bridge.state.apply(patches)
  }
  bridge.commands.registerCommand('rundown.appendItem', appendItem)
}
