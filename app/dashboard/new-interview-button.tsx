'use client'

import { useState } from 'react'
import { NewInterviewModal } from './new-interview-modal'

export function NewInterviewButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button className="new-btn" onClick={() => setOpen(true)}>
        + New interview
      </button>
      {open && <NewInterviewModal onClose={() => setOpen(false)} />}
    </>
  )
}