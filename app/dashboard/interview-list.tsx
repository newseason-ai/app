'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SendLinkModal } from './send-link-modal'

type Template = {
  id: string
  name: string
  openingPrompt: string
}

export function InterviewList({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<Template | null>(null)

  return (
    <>
      <div className="interviews" style={{
        gridTemplateColumns: templates.length === 1
          ? 'minmax(0, 680px)'
          : 'repeat(auto-fill, minmax(480px, 1fr))'
      }}>
        {templates.map(template => (
          <div
            className="ic"
            key={template.id}
            onClick={() => router.push(`/dashboard/interviews/${template.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="ic-top">
              <div>
                <div className="ic-name">{template.name}</div>
                <div className="ic-prompt">&ldquo;{template.openingPrompt}&rdquo;</div>
              </div>
              <div className="ic-actions">
                <span className="ic-badge">Active</span>
                <button
                  className="ic-send"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveModal(template)
                  }}
                >
                  Send link ↗
                </button>
              </div>
            </div>
            <div className="ic-prog">
              <div className="prog-row">
                <span>Response progress</span>
                <span>0 responses</span>
              </div>
              <div className="prog-bg"><div className="prog-fill" style={{ width: '0%' }} /></div>
              <div className="prog-hint">Collect responses to unlock insights</div>
            </div>
            <div className="ic-insight">
              <div className="ic-insight-text">No insights yet — send links to start collecting responses.</div>
              <button
                className="ic-insight-btn secondary"
                onClick={(e) => e.stopPropagation()}
              >
                Generate anyway
              </button>
            </div>
            <div className="ic-stats">
              <div className="ic-stat"><span>0</span> responses</div>
              <div className="ic-stat"><span>—</span> avg duration</div>
              <div className="ic-stat"><span>0</span> opted in</div>
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <SendLinkModal
          templateId={activeModal.id}
          templateName={activeModal.name}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  )
}