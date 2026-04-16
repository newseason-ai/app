'use client'

import { useRouter } from 'next/navigation'

type Turn = {
  id: string
  speaker: string
  content: string
  turnIndex: number
  startedAtS: number
}

type Tag = {
  id: string
  label: string
  sentiment: string
  sourceQuote: string
  phase: string
}

type Session = {
  id: string
  status: string
  durationS: number | null
  startedAt: string
  endedAt: string | null
  followUpOptIn: boolean
  vapiCallId: string
}

function formatDuration(s: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}m ${sec.toString().padStart(2, '0')}s`
}

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

const SENTIMENT_STYLES: Record<string, { bg: string; color: string }> = {
  positive: { bg: '#0F3D2E', color: '#3DBFA0' },
  negative: { bg: '#3D1A1A', color: '#E24B4A' },
  neutral: { bg: 'rgba(255,255,255,0.06)', color: '#888' },
}

async function copyTranscript(transcript: Turn[]) {
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
  session,
  transcript,
  tags,
  respondentName,
  respondentRef,
  respondentContext,
  interviewName,
  interviewId,
  fromLabel,
}: {
  session: Session
  transcript: Turn[]
  tags: Tag[]
  respondentName: string | null
  respondentRef: string | null
  respondentContext: string | null
  interviewName: string
  interviewId: string
  fromLabel: string
}) {
  const router = useRouter()
  const displayName = respondentName ?? respondentRef ?? 'Anonymous'
  const visibleTurns = transcript.filter(t => t.speaker.toLowerCase() !== 'system')

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
        .section-btn:hover { color: var(--ink-muted); }

        .tags-body { padding: 14px 18px; display: flex; flex-wrap: wrap; gap: 8px; }
        .tag { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 500; }
        .tag-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .tag-quote { font-size: 12px; color: var(--ink-faint); padding: 0 18px 14px; font-style: italic; line-height: 1.6; border-top: 1px solid rgba(255,255,255,0.04); padding-top: 10px; margin-top: 2px; }
        .no-tags { padding: 20px 18px; font-size: 12px; color: #333; font-style: italic; }

        .transcript-body { padding: 4px 0; }
        .turn { display: grid; grid-template-columns: 76px 1fr; gap: 12px; padding: 10px 18px; border-bottom: 1px solid rgba(255,255,255,0.03); }
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
            <div className="meta-label">
              {respondentContext ? 'Respondent context' : 'Date'}
            </div>
            <div className="meta-value muted">
              {respondentContext ?? formatDate(session.startedAt)}
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <span className="section-title">Tags</span>
          </div>
          {tags.length > 0 ? (
            <>
              <div className="tags-body">
                {tags.map(tag => {
                  const style = SENTIMENT_STYLES[tag.sentiment] ?? SENTIMENT_STYLES.neutral
                  return (
                    <span
                      key={tag.id}
                      className="tag"
                      style={{ background: style.bg, color: style.color }}
                    >
                      <span className="tag-dot" />
                      {tag.label}
                    </span>
                  )
                })}
              </div>
              {tags[0]?.sourceQuote && (
                <div className="tag-quote">
                  &ldquo;{tags[0].sourceQuote}&rdquo;
                </div>
              )}
            </>
          ) : (
            <div className="no-tags">
              No tags yet — tags are generated automatically after each session.
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
                  <div className="turn" key={turn.id}>
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
              <div className="no-tags">No transcript available for this session.</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}