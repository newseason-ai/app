'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { formatDuration } from '@/lib/format'
import type { SessionData, SessionTranscriptTurn } from '@/lib/queries/session'
import { invalidateSession, useSession } from '@/lib/queries/session-client'

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

async function copyTranscript(transcript: SessionTranscriptTurn[]) {
  const text = transcript
    .map(t => `${t.speaker.toUpperCase()} [${formatTime(t.startedAtS)}]\n${t.content}`)
    .join('\n\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

export function SessionDetail({
  id,
  initialData,
  fromLabel,
}: {
  id: string
  initialData: SessionData
  fromLabel: string
}) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: sessionPayload = initialData } = useSession(id, initialData)
  const {
    session,
    transcript,
    findings,
    respondentName,
    respondentRef,
    respondentContext,
    interviewName,
    interviewId,
  } = sessionPayload

  const generateFindings = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/sessions/${id}/findings`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to generate findings')
    },
    onSettled: () => {
      invalidateSession(queryClient, id)
    },
  })

  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)
  const displayName = respondentName ?? respondentRef ?? 'Anonymous'
  const visibleTurns = transcript.filter(t => t.speaker.toLowerCase() !== 'system')
  const generateErrorMsg =
    generateFindings.error instanceof Error
      ? generateFindings.error.message
      : generateFindings.isError
        ? 'Something went wrong'
        : null

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113; --surface: #1E1E20; --surface2: #1A1A1C;
          --ink: #ffffff; --ink-muted: #666; --ink-faint: #444;
          --border: rgba(255,255,255,0.07); --teal: #3DBFA0;
        }
        html, body { min-height: 100vh; background: var(--bg); }
        .main { padding: 40px 48px; max-width: 860px; font-family: var(--font); }

        .back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--ink-faint); cursor: pointer; background: none; border: none; font-family: var(--font); padding: 0; margin-bottom: 28px; transition: color 0.15s; }
        .back:hover { color: var(--ink-muted); }

        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .respondent { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin-bottom: 4px; }
        .interview-ref { font-size: 12px; color: var(--ink-faint); }
        .opt-in-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; padding: 5px 12px; border-radius: 100px; background: #0F3D2E; color: var(--teal); flex-shrink: 0; }
        .opt-in-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

        .meta-strip { display: flex; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
        .meta-item { padding: 14px 20px; border-right: 1px solid rgba(255,255,255,0.05); flex: 1; }
        .meta-item:last-child { border-right: none; }
        .meta-label { font-size: 10px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
        .meta-value { font-size: 15px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); }
        .meta-value.teal { color: var(--teal); }
        .meta-value.muted { color: var(--ink-muted); font-weight: 400; font-size: 13px; }

        .section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 12px; }
        .section-header { padding: 13px 18px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .section-title { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
        .section-btn { font-family: var(--font); font-size: 11px; color: var(--ink-faint); background: none; border: none; cursor: pointer; transition: color 0.15s; padding: 0; }
        .section-btn:hover:not(:disabled) { color: var(--ink-muted); }
        .section-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        .section.findings-section.generating {
          animation: findingsSectionPulse 1.4s ease-in-out infinite;
        }
        @keyframes findingsSectionPulse {
          0%, 100% { border-color: rgba(255, 255, 255, 0.07); }
          50% { border-color: rgba(61, 191, 160, 0.22); }
        }

        .findings-empty { padding: 20px 18px; font-size: 12px; color: #333; font-style: italic; }
        .no-tags { padding: 20px 18px; font-size: 12px; color: #333; font-style: italic; }

        .transcript-body { padding: 4px 0; }
        .turn { display: grid; grid-template-columns: 76px 1fr; gap: 12px; padding: 10px 18px; border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.3s ease; }
        .turn:last-child { border-bottom: none; }
        .turn-meta { display: flex; flex-direction: column; align-items: flex-end; padding-top: 2px; gap: 3px; }
        .turn-speaker { font-size: 10px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
        .turn-speaker.ai { color: var(--teal); }
        .turn-speaker.user { color: #888; }
        .turn-time { font-size: 10px; color: #333; }
        .turn-content { font-size: 13px; line-height: 1.65; }
        .turn-content.ai { color: var(--ink-muted); }
        .turn-content.user { color: #ddd; }
      `}</style>

      <div className="main">
        <button className="back" onClick={() => router.push(`/dashboard/interviews/${interviewId}`)}>
          ← Back to {fromLabel}
        </button>

        <div className="page-header">
          <div>
            <div className="respondent">{displayName}</div>
            <div className="interview-ref">
              {interviewName} · {formatDate(session.startedAt)}
            </div>
            {respondentContext && (
              <div style={{
                fontSize: 12,
                color: '#666',
                lineHeight: 1.6,
                marginTop: 5,
                maxWidth: 860,
                fontStyle: 'normal',
              }}
              >
                {respondentContext}
              </div>
            )}
          </div>
          {session.followUpOptIn && (
            <span className="opt-in-badge">
              <span className="opt-in-dot" />
              Follow-up opt-in
            </span>
          )}
        </div>

        <div className="meta-strip">
          <div className="meta-item">
            <div className="meta-label">Status</div>
            <div className={`meta-value ${session.status === 'completed' ? 'teal' : ''}`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Duration</div>
            <div className="meta-value">{formatDuration(session.durationS)}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Turns</div>
            <div className="meta-value">{visibleTurns.length}</div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Sentiment</div>
            <div className="meta-value" style={{
              color: session.sentiment === 'positive' ? '#3DBFA0'
                : session.sentiment === 'negative' ? '#E24B4A'
                  : session.sentiment === 'mixed' ? '#EF9F27'
                    : '#444',
            }}
            >
              {session.sentiment
                ? session.sentiment.charAt(0).toUpperCase() + session.sentiment.slice(1)
                : '—'}
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-label">Response quality</div>
            <div className="meta-value" style={{
              color: session.completionQuality === 'rich' ? '#3DBFA0'
                : session.completionQuality === 'adequate' ? '#EF9F27'
                  : session.completionQuality === 'thin' ? '#666'
                    : '#444',
            }}
            >
              {session.completionQuality
                ? session.completionQuality.charAt(0).toUpperCase() + session.completionQuality.slice(1)
                : '—'}
            </div>
          </div>
        </div>

        <div
          className={`section findings-section${generateFindings.isPending ? ' generating' : ''}`}
          style={{
            opacity: generateFindings.isPending ? 0.6 : 1,
            transition: 'opacity 0.3s ease',
          }}
        >
          <div className="section-header">
            <span className="section-title">Findings</span>
            <button
              type="button"
              className="section-btn"
              onClick={() => generateFindings.mutate()}
              disabled={generateFindings.isPending}
              style={{
                color: findings.length === 0 && !generateFindings.isPending ? '#3DBFA0' : undefined,
              }}
            >
              {generateFindings.isPending ? 'Generating...' : findings.length > 0 ? 'Regenerate' : 'Generate'}
            </button>
          </div>
          {generateErrorMsg && findings.length > 0 && (
            <div style={{ padding: '0 18px 12px', color: '#E24B4A', fontSize: 12 }}>
              {generateErrorMsg}
            </div>
          )}
          {findings.length > 0 ? (
            <div style={{ paddingBottom: 4 }}>
            <div style={{ padding: '4px 0' }}>
              {findings.filter(f => f.questionText).map(f => (
                <div
                  key={f.id}
                  onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}
                  style={{
                    padding: '18px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = ''
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  >
                    <div style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#777',
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                    }}
                    >
                      {f.questionText}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                      {f.sentiment && f.sentiment !== 'neutral' && (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '2px 8px',
                          borderRadius: 100,
                          background: f.sentiment === 'positive' ? 'rgba(61,191,160,0.12)'
                            : f.sentiment === 'negative' ? 'rgba(226,75,74,0.12)'
                              : 'rgba(239,159,39,0.12)',
                          color: f.sentiment === 'positive' ? '#3DBFA0'
                            : f.sentiment === 'negative' ? '#E24B4A'
                              : '#EF9F27',
                        }}
                        >
                          <span style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: 'currentColor',
                            display: 'inline-block',
                          }}
                          />
                          {f.sentiment.charAt(0).toUpperCase() + f.sentiment.slice(1)}
                        </span>
                      )}
                      <span style={{ fontSize: 13, color: '#333', marginLeft: 4 }}>
                        {expandedFinding === f.id ? '↑' : '↓'}
                      </span>
                    </div>
                  </div>

                  <p style={{
                    fontSize: 13,
                    color: '#ccc',
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                  >
                    {f.synthesis}
                  </p>

                  {expandedFinding === f.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        marginTop: 14,
                        borderLeft: '2px solid rgba(255,255,255,0.08)',
                        paddingLeft: 12,
                      }}
                    >
                      <p style={{
                        fontSize: 12,
                        color: '#666',
                        fontStyle: 'italic',
                        lineHeight: 1.6,
                        marginBottom: f.turnIndex !== null ? 8 : 0,
                      }}
                      >
                        &ldquo;{f.evidence}&rdquo;
                      </p>
                      {f.turnIndex !== null && (
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#3DBFA0',
                            fontSize: 11,
                            cursor: 'pointer',
                            padding: 0,
                            fontFamily: 'var(--font, system-ui)',
                          }}
                          onClick={() => {
                            const el = document.getElementById(`turn-${f.turnIndex}`)
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                              el.style.background = 'rgba(61,191,160,0.08)'
                              setTimeout(() => { el.style.background = '' }, 2000)
                            }
                          }}
                        >
                          ↓ View in transcript
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {findings.filter(f => !f.questionText).length > 0 && (
                <>
                  <div style={{
                    padding: '20px 20px 4px',
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#333',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                  }}
                  >
                    Other observations
                  </div>
                  {findings.filter(f => !f.questionText).map(f => (
                    <div
                      key={f.id}
                      onClick={() => setExpandedFinding(expandedFinding === f.id ? null : f.id)}
                      style={{
                        padding: '18px 20px',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = ''
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                      >
                        <div style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#777',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                        }}
                        >
                          {f.title ?? 'Observation'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 12 }}>
                          {f.sentiment && f.sentiment !== 'neutral' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 11,
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: 100,
                              background: f.sentiment === 'positive' ? 'rgba(61,191,160,0.12)'
                                : f.sentiment === 'negative' ? 'rgba(226,75,74,0.12)'
                                  : 'rgba(239,159,39,0.12)',
                              color: f.sentiment === 'positive' ? '#3DBFA0'
                                : f.sentiment === 'negative' ? '#E24B4A'
                                  : '#EF9F27',
                            }}
                            >
                              <span style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                background: 'currentColor',
                                display: 'inline-block',
                              }}
                              />
                              {f.sentiment.charAt(0).toUpperCase() + f.sentiment.slice(1)}
                            </span>
                          )}
                          <span style={{ fontSize: 13, color: '#333', marginLeft: 4 }}>
                            {expandedFinding === f.id ? '↑' : '↓'}
                          </span>
                        </div>
                      </div>

                      <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.65, margin: 0 }}>
                        {f.synthesis}
                      </p>

                      {expandedFinding === f.id && (
                        <div
                          onClick={e => e.stopPropagation()}
                          style={{
                            marginTop: 14,
                            borderLeft: '2px solid rgba(255,255,255,0.08)',
                            paddingLeft: 12,
                          }}
                        >
                          <p style={{
                            fontSize: 12,
                            color: '#666',
                            fontStyle: 'italic',
                            lineHeight: 1.6,
                            marginBottom: f.turnIndex !== null ? 8 : 0,
                          }}
                          >
                            &ldquo;{f.evidence}&rdquo;
                          </p>
                          {f.turnIndex !== null && (
                            <button
                              type="button"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#3DBFA0',
                                fontSize: 11,
                                cursor: 'pointer',
                                padding: 0,
                                fontFamily: 'var(--font, system-ui)',
                              }}
                              onClick={() => {
                                const el = document.getElementById(`turn-${f.turnIndex}`)
                                if (el) {
                                  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                  el.style.background = 'rgba(61,191,160,0.08)'
                                  setTimeout(() => { el.style.background = '' }, 2000)
                                }
                              }}
                            >
                              ↓ View in transcript
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
            </div>
          ) : (
            <div className="no-tags">
              {generateFindings.isPending
                ? 'Generating findings — this takes a few seconds...'
                : 'Findings are generated automatically after each session, or you can generate them now.'}
              {generateErrorMsg && (
                <div style={{ color: '#E24B4A', fontSize: 12, marginTop: 8 }}>
                  {generateErrorMsg}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-title">
              Transcript · {visibleTurns.length} turns
            </span>
            <button
              className="section-btn"
              onClick={() => copyTranscript(visibleTurns)}
            >
              Copy
            </button>
          </div>
          <div className="transcript-body">
            {visibleTurns.length > 0 ? (
              visibleTurns.map(turn => {
                const isAI = turn.speaker.toLowerCase() === 'bot' ||
                             turn.speaker.toLowerCase() === 'assistant' ||
                             turn.speaker.toLowerCase() === 'ai'
                const speakerLabel = isAI ? 'AI' : (respondentName ?? 'Respondent')
                return (
                  <div className="turn" key={turn.id} id={`turn-${turn.turnIndex}`}>
                    <div className="turn-meta">
                      <span className={`turn-speaker ${isAI ? 'ai' : 'user'}`}>
                        {speakerLabel}
                      </span>
                      <span className="turn-time">{formatTime(turn.startedAtS)}</span>
                    </div>
                    <div className={`turn-content ${isAI ? 'ai' : 'user'}`}>
                      {turn.content}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="findings-empty">No transcript available for this session.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
