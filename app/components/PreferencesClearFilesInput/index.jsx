import React from 'react'
import './style.css'

import { PopupConfirm } from '../Popup/confirm'

import * as api from '../../api'

export function PreferencesClearFilesInput ({ label }) {
  const [confirmIsOpen, setConfirmIsOpen] = React.useState(false)

  async function handleCloseConfirm (confirm) {
    setConfirmIsOpen(false)
    if (!confirm) {
      return
    }

    const bridge = await api.load()
    bridge.files.clear()
  }

  return (
    <>
      <PopupConfirm confirmText='Proceed' abortText='Cancel' open={confirmIsOpen} onChange={confirm => handleCloseConfirm(confirm)}>
        <div className='u-heading--2'>{label}</div>
        This action is irreversible
      </PopupConfirm>
      <div className='PreferencesClearFilesInput'>
        <button className='Button Button--secondary' onClick={() => setConfirmIsOpen(true)}>
          {label}
        </button>
      </div>
    </>
  )
}
