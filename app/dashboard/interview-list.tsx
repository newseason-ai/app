'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SendLinkModal } from './send-link-modal'

type Interview = {
  id: string
  name: string
  context: string | null
  completed: number
  progressPct: number
  remaining: number
  hasInsight: boolean
  insightGeneratedAt: string | null
  topThemes: string[]
  sentiment: { positive: number; mixed: number; negative: number }
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function InterviewList({ interviews }: { interviews: Interview[] }) {
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<Interview | null>(null)

  return (
    <>
      <style>{`
        .il-row { display: grid; grid-template-columns: 1fr 110px 160px 200px; gap: 0; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s; }
        .il-row:hover { background: rgba(255,255,255,0.015); }
        .il-col { padding: 24px 24px; }
        .il-col:first-child { padding-left: 16px; }
        .il-col + .il-col { border-left: 1px solid rgba(255,255,255,0.04); }
        .il-col:last-child { border-left: none; padding-right: 0; }

        .il-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; color: #fff; margin-bottom: 5px; }
        .il-context { font-size: 12px; color: #333; line-height: 1.55; margin-bottom: 8px; }
        .il-themes { display: flex; gap: 4px; flex-wrap: wrap; }
        .il-theme { font-size: 10px; color: #444; background: rgba(255,255,255,0.04); border-radius: 100px; padding: 2px 8px; }

        .il-value { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: #fff; margin-bottom: 2px; }
        .il-sub { font-size: 10px; color: #333; }

        .il-progress-track { height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; margin-bottom: 6px; }
        .il-progress-fill { height: 100%; border-radius: 1px; background: #3DBFA0; transition: width 0.3s ease; }

        .il-insight-ready { font-size: 12px; color: #3DBFA0; font-weight: 500; margin-bottom: 3px; }
        .il-insight-meta { font-size: 10px; color: #333; }
        .il-insight-pending { font-size: 11px; color: #444; margin-bottom: 3px; }
        .il-insight-generate { font-size: 11px; color: #fff; cursor: pointer; font-weight: 500; transition: opacity 0.15s; }
        .il-insight-generate:hover { opacity: 0.7; }
        .il-insight-none { font-size: 11px; color: #2A2A2C; }

        .il-action-btn { font-family: system-ui, sans-serif; font-size: 11px; font-weight: 500; color: #555; background: none; border: none; padding: 0; cursor: pointer; transition: color 0.15s; }
        .il-action-btn:hover { color: #888; }
      `}</style>

      {interviews.map(interview => (
        <div
          className="il-row"
          key={interview.id}
          onClick={() => router.push(`/dashboard/interviews/${interview.id}`)}
        >
          {/* Interview name + context + themes */}
          <div className="il-col">
            <div className="il-name">{interview.name}</div>
            {interview.context && (
              <div className="il-context">{interview.context}</div>
            )}
            {interview.topThemes.length > 0 && (
              <div className="il-themes">
                {interview.topThemes.map((theme, i) => (
                  <span className="il-theme" key={i}>{theme}</span>
                ))}
              </div>
            )}
          </div>

          {/* Responses */}
          <div className="il-col">
            <div className="il-value">{interview.completed}</div>
            <div className="il-sub">completed</div>
            {interview.completed > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {interview.sentiment.positive > 0 && (
                  <span style={{ fontSize: 10, color: '#3DBFA0', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {interview.sentiment.positive}
                  </span>
                )}
                {interview.sentiment.mixed > 0 && (
                  <span style={{ fontSize: 10, color: '#EF9F27', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {interview.sentiment.mixed}
                  </span>
                )}
                {interview.sentiment.negative > 0 && (
                  <span style={{ fontSize: 10, color: '#E24B4A', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {interview.sentiment.negative}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress */}
          <div className="il-col">
            <div className="il-progress-track">
              <div className="il-progress-fill" style={{ width: `${interview.progressPct}%` }} />
            </div>
            <div className="il-sub">
              {interview.completed}/15 responses
            </div>
            <button
              type="button"
              className="il-action-btn"
              onClick={e => {
                e.stopPropagation()
                setActiveModal(interview)
              }}
            >
              Send link ↗
            </button>
          </div>

          {/* Insights */}
          <div className="il-col">
            {interview.hasInsight ? (
              <>
                <div className="il-insight-ready">Insights ready</div>
                <div className="il-insight-meta" style={{ marginBottom: 8 }}>
                  {interview.insightGeneratedAt && `Generated ${timeAgo(interview.insightGeneratedAt)}`}
                </div>
                <div
                  className="il-insight-generate"
                  onClick={e => {
                    e.stopPropagation()
                    router.push('/dashboard/insights')
                  }}
                >
                  View insights →
                </div>
              </>
            ) : interview.completed >= 3 ? (
              <>
                <div className="il-insight-pending" style={{ marginBottom: 4 }}>Ready to generate</div>
                <div
                  className="il-insight-generate"
                  onClick={e => {
                    e.stopPropagation()
                    router.push('/dashboard/insights')
                  }}
                >
                  Generate now →
                </div>
              </>
            ) : (
              <div className="il-insight-none">Collect more responses</div>
            )}
          </div>
        </div>
      ))}

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
