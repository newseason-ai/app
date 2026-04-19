'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SendLinkModal } from './send-link-modal'

type Template = {
  id: string
  name: string
}

type TemplateStats = {
  total: number
  completed: number
}

type Props = {
  templates: Template[]
  templateStats: Record<string, TemplateStats>
}

export function InterviewList({ templates, templateStats }: Props) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<Template | null>(null)

  return (
    <>
      <div className="interviews" style={{
        gridTemplateColumns: templates.length === 1
          ? 'minmax(0, 680px)'
          : 'repeat(auto-fill, minmax(480px, 1fr))'
      }}>
        {templates.map(template => {
          const stats = templateStats[template.id] ?? { total: 0, completed: 0 }
          const SIGNAL_THRESHOLD = 15
          const progressPct = stats.total === 0
            ? 0
            : Math.min((stats.completed / SIGNAL_THRESHOLD) * 100, 100)
          const hasSignal = stats.completed >= SIGNAL_THRESHOLD

          return (
            <div
              className="ic"
              key={template.id}
              onClick={() => router.push(`/dashboard/interviews/${template.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="ic-top">
                <div>
                  <div className="ic-name">{template.name}</div>
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
                  <span>{stats.completed} response{stats.completed === 1 ? '' : 's'}</span>
                </div>
                <div className="prog-bg">
                  <div className="prog-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className={`prog-hint ${hasSignal ? 'ready' : ''}`}>
                  {hasSignal
                    ? '✓ Enough signal to generate insights'
                    : stats.completed === 0
                      ? 'Collect responses to unlock insights'
                      : `~${SIGNAL_THRESHOLD - stats.completed} more responses recommended`
                  }
                </div>
              </div>

              <div className="ic-insight">
                <div className="ic-insight-text">
                  {hasSignal
                    ? 'Ready to generate insights across all responses.'
                    : 'No insights yet — send links to start collecting responses.'
                  }
                </div>
                <button
                  className={`ic-insight-btn ${hasSignal ? '' : 'secondary'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {hasSignal ? 'Generate insights' : 'Generate anyway'}
                </button>
              </div>

              <div className="ic-stats">
                <div className="ic-stat"><span>{stats.total}</span> total</div>
                <div className="ic-stat"><span>{stats.completed}</span> completed</div>
                <div className="ic-stat"><span>{stats.total - stats.completed}</span> dropped</div>
              </div>
            </div>
          )
        })}
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