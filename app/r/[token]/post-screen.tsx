'use client'

import { useState } from 'react'
import '../respondent.css'

type PostScreenProps = {
  company: { name: string }
  onOptIn: () => void
  onClose: () => void
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="post-screen-check-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4 10-10" />
    </svg>
  )
}

export function PostScreen({ company, onOptIn, onClose }: PostScreenProps) {
  const [opted, setOpted] = useState(false)

  function handleOptIn() {
    setOpted(true)
    onOptIn()
  }

  return (
    <div className="post-screen-root">
      <div className="post-screen-container">
        <div className="post-screen-stack">
          <div className="post-screen-icon-wrap">
            <CheckIcon />
          </div>

          <h1 className="post-screen-title">
            Thanks for sharing
          </h1>

          <p className="post-screen-subtitle">
            Your feedback has been sent to the {company.name} team. It&apos;ll help
            shape what they build next.
          </p>

          <div className="post-screen-divider" />

          {!opted ? (
            <>
              <p className="post-screen-eyebrow">
                Stay in the loop
              </p>

              <div className="post-screen-optin-card">
                <h2 className="post-screen-optin-title">
                  Want to be kept in the loop?
                </h2>
                <p className="post-screen-optin-text">
                  {company.name} will occasionally reach out when your input would be
                  especially useful.
                </p>

                <button
                  type="button"
                  onClick={handleOptIn}
                  className="post-screen-optin-btn"
                >
                  Yes, keep me in the loop
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="post-screen-close-btn"
              >
                No thanks · close
              </button>
            </>
          ) : (
            <div className="post-screen-success">
              <svg
                viewBox="0 0 24 24"
                className="post-screen-success-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12 4 4 10-10" />
              </svg>
              <p className="post-screen-success-title">
                You&apos;re in the loop
              </p>
              <p className="post-screen-success-text">
                {company.name} will reach out when your input would be helpful.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}