import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { ServerSelector } from '../components/ServerSelector'

export const InspectorServer = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])

  React.useEffect(() => {
    const selection = bridge.client.getSelection()
    setSelection(selection)
  }, [state])

  function handleChange (newServer) {
    for (const id of selection) {
      bridge.items.applyItem(id, {
        caspar: {
          server: newServer
        }
      })
    }
  }

  const values = React.useMemo(() => {
    const values = new Set()
    for (const id of selection) {
      values.add(state?.items?.[id]?.caspar?.server)
    }
    return Array.from(values)
  }, [state, selection])

  return (
    <ServerSelector
      value={values[0]}
      onChange={newServer => handleChange(newServer)}
      multipleValuesSelected={values.length > 1}
    />
  )
}
