import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

import { Status } from './views/Status'

export default function App () {
  const [view, setView] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('path'))
  }, [])

  return (
    <SharedContext.Provider>
      {
        (function () {
          switch (view) {
            case 'settings/servers':
              return <Settings.Servers />
            case 'status':
              return <Status />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}