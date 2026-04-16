'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SendLinkModal } from '../../send-link-modal'

type Session = {
  id: string
  status: string
  durationS: number | null
  startedAt: string
  respondentName: string | null
  respondentRef: string | null
}

type Template = {
  id: string
  name: string
  openingPrompt: string
  context: string | null
  directedQuestions: string[]
  targetDurationS: number
  active: boolean
  createdAt: string
}

function formatDuration(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec.toString().padStart(2, '0')}s`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function InterviewDetail({
  template,
  sessions,
  companyName,
}: {
  template: Template
  sessions: Session[]
  companyName: string
}) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(template.name)
  const [openingPrompt, setOpeningPrompt] = useState(template.openingPrompt)
  const [context, setContext] = useState(template.context ?? '')
  const [questions, setQuestions] = useState<string[]>(
    template.directedQuestions.length > 0 ? template.directedQuestions : ['']
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const completedSessions = sessions.filter(s => s.status === 'completed')
  const avgDuration = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((sum, s) => sum + (s.durationS ?? 0), 0) / completedSessions.length)
    : null

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          openingPrompt,
          context: context || null,
          directedQuestions: questions.filter(q => q.trim()),
        })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setEditing(false)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

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
        html, body { min-height: 100vh; background: var(--bg); }
        .layout { font-family: var(--font); background: var(--bg); min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; }
        .sidebar { background: #0D0D0F; border-right: 1px solid var(--border); padding: 20px 0; display: flex; flex-direction: column; }
        .sb-logo { font-size: 14px; font-weight: 600; color: var(--ink); padding: 0 20px 20px; border-bottom: 1px solid var(--border); margin-bottom: 8px; letter-spacing: -0.01em; }
        .sb-logo span { color: var(--ink-faint); font-weight: 400; }
        .sb-item { display: flex; align-items: center; gap: 8px; padding: 8px 20px; color: var(--ink-muted); font-size: 13px; text-decoration: none; transition: color 0.15s; }
        .sb-item:hover { color: var(--ink); }
        .sb-item.active { color: var(--ink); font-weight: 500; }
        .sb-item svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
        .sb-bottom { margin-top: auto; padding: 16px 20px; border-top: 1px solid var(--border); }
        .sb-email { font-size: 12px; color: var(--ink-muted); margin-bottom: 6px; }
        .sb-signout { font-size: 12px; color: var(--ink-faint); cursor: pointer; background: none; border: none; font-family: var(--font); padding: 0; }

        .main { padding: 40px 48px; max-width: 1100px; overflow: auto; }
        .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-faint); cursor: pointer; background: none; border: none; font-family: var(--font); padding: 0; margin-bottom: 28px; transition: color 0.15s; }
        .back:hover { color: var(--ink-muted); }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .page-title { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin-bottom: 4px; }
        .page-sub { font-size: 13px; color: var(--ink-faint); }
        .header-actions { display: flex; gap: 8px; }
        .btn { font-family: var(--font); font-size: 13px; font-weight: 500; padding: 9px 18px; border-radius: 100px; cursor: pointer; border: none; transition: opacity 0.15s; }
        .btn-primary { background: var(--ink); color: #111; }
        .btn-primary:hover { opacity: 0.85; }
        .btn-secondary { background: rgba(255,255,255,0.07); color: var(--ink-muted); }
        .btn-secondary:hover { background: rgba(255,255,255,0.12); }
        .btn-ghost { background: none; border: 1px solid var(--border); color: var(--ink-faint); }
        .btn-ghost:hover { color: var(--ink-muted); border-color: rgba(255,255,255,0.15); }

        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }
        .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .panel-header { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .panel-title { font-size: 13px; font-weight: 600; color: var(--ink); }
        .panel-action { font-size: 12px; color: var(--ink-faint); cursor: pointer; background: none; border: none; font-family: var(--font); transition: color 0.15s; }
        .panel-action:hover { color: var(--ink-muted); }
        .panel-body { padding: 20px; }

        .field { margin-bottom: 16px; }
        .field:last-child { margin-bottom: 0; }
        .field-label { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 6px; }
        .field-value { font-size: 14px; color: var(--ink-muted); line-height: 1.6; }
        .field-input { font-family: var(--font); font-size: 14px; padding: 10px 14px; background: #111113; border: 1px solid var(--border); border-radius: 10px; color: var(--ink); outline: none; width: 100%; transition: border-color 0.15s; }
        .field-input:focus { border-color: rgba(255,255,255,0.2); }
        .field-textarea { font-family: var(--font); font-size: 14px; padding: 10px 14px; background: #111113; border: 1px solid var(--border); border-radius: 10px; color: var(--ink); outline: none; width: 100%; resize: none; line-height: 1.55; transition: border-color 0.15s; }
        .field-textarea:focus { border-color: rgba(255,255,255,0.2); }

        .questions-wrap { background: #111113; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
        .q-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .q-row:last-child { border-bottom: none; }
        .q-num { font-size: 11px; color: var(--ink-faint); min-width: 16px; }
        .q-input { font-family: var(--font); font-size: 13px; background: none; border: none; color: var(--ink); outline: none; flex: 1; }
        .q-input::placeholder { color: #333; }
        .q-add { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #444; background: none; border: none; cursor: pointer; font-family: var(--font); padding: 10px 14px; width: 100%; text-align: left; border-top: 1px solid rgba(255,255,255,0.04); transition: color 0.15s; }
        .q-add:hover { color: var(--ink-muted); }

        .save-row { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
        .save-error { font-size: 12px; color: #E24B4A; margin-top: 8px; text-align: right; }

        .stat-row { display: flex; gap: 24px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .stat { }
        .stat-label { font-size: 11px; color: var(--ink-faint); margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }

        .sessions-table { width: 100%; }
        .sess-row { display: grid; grid-template-columns: 1fr 100px 90px 60px; align-items: center; padding: 11px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.1s; gap: 12px; }
        .sess-row:last-child { border-bottom: none; }
        .sess-row:hover { background: rgba(255,255,255,0.02); }
        .sess-row.header { cursor: default; background: none; }
        .sess-row.header:hover { background: none; }
        .sess-col-label { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .sess-name { font-size: 13px; font-weight: 500; color: var(--ink); }
        .sess-time { font-size: 11px; color: var(--ink-faint); margin-top: 1px; }
        .sess-badge { font-size: 11px; font-weight: 500; padding: 3px 8px; border-radius: 100px; display: inline-block; }
        .sess-badge.completed { background: #0F3D2E; color: var(--teal); }
        .sess-badge.abandoned { background: #3D2A0A; color: #EF9F27; }
        .sess-badge.error { background: #3D0F0F; color: #E24B4A; }
        .sess-dur { font-size: 12px; color: var(--ink-muted); }
        .sess-arrow { font-size: 16px; color: var(--ink-faint); text-align: right; }

        .empty-sessions { padding: 40px 20px; text-align: center; color: var(--ink-faint); font-size: 13px; line-height: 1.6; }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sb-logo">New Season <span>AI</span></div>
          <a href="/dashboard" className="sb-item">
            <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
            Overview
          </a>
          <a href="/dashboard/interviews" className="sb-item active">
            <svg viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h7"/></svg>
            Interviews
          </a>
          <a href="/dashboard/sessions" className="sb-item">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            Sessions
          </a>
          <a href="/dashboard/insights" className="sb-item">
            <svg viewBox="0 0 16 16"><path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5z"/></svg>
            Insights
          </a>
          <div className="sb-bottom">
            <div className="sb-email">{companyName}</div>
            <form action="/auth/signout" method="post">
              <button className="sb-signout" type="submit">Sign out</button>
            </form>
          </div>
        </aside>

        <main className="main">
          <button className="back" onClick={() => router.push('/dashboard')}>
            ← Back to overview
          </button>

          <div className="page-header">
            <div>
              <div className="page-title">{editing ? 'Editing interview' : template.name}</div>
              <div className="page-sub">Created {timeAgo(template.createdAt)}</div>
            </div>
            <div className="header-actions">
              {!editing && (
                <>
                  <button className="btn btn-ghost" onClick={() => setEditing(true)}>Edit</button>
                  <button className="btn btn-primary" onClick={() => setShowModal(true)}>Send link ↗</button>
                </>
              )}
            </div>
          </div>

          <div className="grid">
            {/* Left — interview config */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">Interview setup</span>
                {editing && (
                  <button className="panel-action" onClick={() => setEditing(false)}>Cancel</button>
                )}
              </div>
              <div className="panel-body">
                {editing ? (
                  <>
                    <div className="field">
                      <div className="field-label">Interview name</div>
                      <input className="field-input" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="field">
                      <div className="field-label">Opening prompt</div>
                      <textarea className="field-textarea" rows={3} value={openingPrompt} onChange={e => setOpeningPrompt(e.target.value)} />
                    </div>
                    <div className="field">
                      <div className="field-label">Product context <span style={{ color: '#333', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>optional</span></div>
                      <textarea className="field-textarea" rows={2} placeholder="Background about your product..." value={context} onChange={e => setContext(e.target.value)} />
                    </div>
                    <div className="field">
                      <div className="field-label">Directed questions <span style={{ color: '#333', fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 4 }}>optional</span></div>
                      <div className="questions-wrap">
                        {questions.map((q, i) => (
                          <div className="q-row" key={i}>
                            <span className="q-num">{i + 1}</span>
                            <input
                              className="q-input"
                              placeholder="Add a question..."
                              value={q}
                              onChange={e => {
                                const updated = [...questions]
                                updated[i] = e.target.value
                                setQuestions(updated)
                              }}
                            />
                          </div>
                        ))}
                        {questions.length < 5 && (
                          <button type="button" className="q-add" onClick={() => setQuestions([...questions, ''])}>
                            + Add question
                          </button>
                        )}
                      </div>
                    </div>
                    {saveError && <div className="save-error">{saveError}</div>}
                    <div className="save-row">
                      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="field">
                      <div className="field-label">Opening prompt</div>
                      <div className="field-value">&ldquo;{template.openingPrompt}&rdquo;</div>
                    </div>
                    {template.context && (
                      <div className="field">
                        <div className="field-label">Product context</div>
                        <div className="field-value">{template.context}</div>
                      </div>
                    )}
                    {template.directedQuestions.length > 0 && (
                      <div className="field">
                        <div className="field-label">Directed questions</div>
                        {template.directedQuestions.map((q, i) => (
                          <div key={i} className="field-value" style={{ marginBottom: 4 }}>{i + 1}. {q}</div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right — sessions */}
            <div className="panel">
              <div className="stat-row">
                <div className="stat">
                  <div className="stat-label">Responses</div>
                  <div className="stat-value">{sessions.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{completedSessions.length}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Avg duration</div>
                  <div className="stat-value">{formatDuration(avgDuration)}</div>
                </div>
              </div>
              {sessions.length > 0 ? (
                <div className="sessions-table">
                  <div className="sess-row header">
                    <div className="sess-col-label">Respondent</div>
                    <div className="sess-col-label">Status</div>
                    <div className="sess-col-label">Duration</div>
                    <div></div>
                  </div>
                  {sessions.map(s => (
                    <div
                      className="sess-row"
                      key={s.id}
                      onClick={() => window.location.href = `/dashboard/sessions/${s.id}`}
                    >
                      <div>
                        <div className="sess-name">
                          {s.respondentName ?? s.respondentRef ?? 'Anonymous'}
                        </div>
                        <div className="sess-time">{timeAgo(s.startedAt)}</div>
                      </div>
                      <div>
                        <span className={`sess-badge ${s.status}`}>{s.status}</span>
                      </div>
                      <div className="sess-dur">{formatDuration(s.durationS)}</div>
                      <div className="sess-arrow">›</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-sessions">
                  No responses yet — send a link to start collecting feedback.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showModal && (
        <SendLinkModal
          templateId={template.id}
          templateName={template.name}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}