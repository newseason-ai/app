'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { NewInterviewModal } from '../new-interview-modal'

type Interview = {
  id: string
  name: string
  openingPrompt: string
  active: boolean
  createdAt: string
  updatedAt: string
  linkCount: number
  sessionCount: number
  completedCount: number
  lastActivityAt: string | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function InterviewsClient({ interviews }: { interviews: Interview[] }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113; --surface: #1E1E20; --surface2: #1A1A1C;
          --ink: #ffffff; --ink-muted: #666; --ink-faint: #444;
          --border: rgba(255,255,255,0.07); --teal: #3DBFA0;
          --font: 'Inter', system-ui, sans-serif;
        }
        .main { padding: 40px 48px; max-width: 1100px; font-family: var(--font); }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .page-sub { font-size: 13px; color: var(--ink-faint); margin-top: 3px; }
        .new-btn { background: var(--ink); color: #111; border: none; border-radius: 100px; padding: 10px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: var(--font); display: inline-flex; align-items: center; gap: 6px; transition: opacity 0.15s; }
        .new-btn:hover { opacity: 0.85; }

        .table { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .table-header { display: grid; grid-template-columns: 1fr 100px 100px 100px 120px; gap: 12px; padding: 11px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .col-label { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .table-row { display: grid; grid-template-columns: 1fr 100px 100px 100px 120px; gap: 12px; padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.1s; align-items: center; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: rgba(255,255,255,0.02); }
        .row-name { font-size: 13px; font-weight: 500; color: var(--ink); margin-bottom: 3px; }
        .row-prompt { font-size: 11px; color: var(--ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 360px; }
        .row-stat { font-size: 13px; color: var(--ink-muted); }
        .row-time { font-size: 12px; color: var(--ink-faint); }
        .status-badge { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 100px; display: inline-block; }
        .status-badge.active { background: #0F3D2E; color: var(--teal); }
        .status-badge.inactive { background: rgba(255,255,255,0.05); color: var(--ink-faint); }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
        .empty-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .empty-icon svg { width: 20px; height: 20px; stroke: var(--ink-faint); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.01em; }
        .empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; max-width: 300px; margin-bottom: 28px; }
      `}</style>

      <div className="main">
        <div className="page-header">
          <div>
            <div className="page-title">Interviews</div>
            <div className="page-sub">
              {interviews.length === 0
                ? 'No interviews yet'
                : `${interviews.length} interview${interviews.length === 1 ? '' : 's'}`
              }
            </div>
          </div>
          <button className="new-btn" onClick={() => setShowModal(true)}>
            + New interview
          </button>
        </div>

        {interviews.length > 0 ? (
          <div className="table">
            <div className="table-header">
              <div className="col-label">Interview</div>
              <div className="col-label">Status</div>
              <div className="col-label">Links</div>
              <div className="col-label">Responses</div>
              <div className="col-label">Last activity</div>
            </div>
            {interviews.map(interview => (
              <div
                className="table-row"
                key={interview.id}
                onClick={() => router.push(`/dashboard/interviews/${interview.id}`)}
              >
                <div>
                  <div className="row-name">{interview.name}</div>
                  <div className="row-prompt">&ldquo;{interview.openingPrompt}&rdquo;</div>
                </div>
                <div>
                  <span className={`status-badge ${interview.active ? 'active' : 'inactive'}`}>
                    {interview.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="row-stat">{interview.linkCount}</div>
                <div className="row-stat">
                  {interview.completedCount}
                  {interview.sessionCount > interview.completedCount && (
                    <span style={{ color: 'var(--ink-faint)', fontSize: 11, marginLeft: 4 }}>
                      / {interview.sessionCount}
                    </span>
                  )}
                </div>
                <div className="row-time">
                  {interview.lastActivityAt
                    ? timeAgo(interview.lastActivityAt)
                    : '—'
                  }
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <svg viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h7"/></svg>
            </div>
            <div className="empty-title">No interviews yet</div>
            <div className="empty-sub">Create your first interview to start collecting voice feedback.</div>
            <button className="new-btn" onClick={() => setShowModal(true)}>
              + Create your first interview
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <NewInterviewModal
          onClose={() => {
            setShowModal(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}