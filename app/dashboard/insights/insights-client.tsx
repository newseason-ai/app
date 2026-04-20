'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Citation = {
  sessionId: string
  respondentName: string | null
  quote: string
  sentiment: string | null
  selectionReason: string
}

type QuestionSummary = {
  questionText: string
  synthesis: string
  skipCount: number
  sentimentDistribution: { positive: number; mixed: number; negative: number }
  citations: Citation[]
}

type Theme = {
  title: string
  description: string
  sessionCount: number
  citations: Citation[]
}

type InsightContent = {
  questionSummaries: QuestionSummary[]
  themes: Theme[]
  sentimentDistribution: { positive: number; mixed: number; negative: number }
  signalStrength: 'strong' | 'moderate' | 'limited'
  completionQualityDistribution: { rich: number; adequate: number; thin: number }
}

type Insight = {
  id: string
  generatedAt: string
  sessionCount: number
  content: InsightContent
}

type Template = { id: string; name: string }

const MIN_SESSIONS = 3

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function SentimentPill({ sentiment, count }: { sentiment: string; count: number }) {
  const styles: Record<string, { bg: string; color: string }> = {
    positive: { bg: 'rgba(61,191,160,0.12)', color: '#3DBFA0' },
    mixed: { bg: 'rgba(239,159,39,0.12)', color: '#EF9F27' },
    negative: { bg: 'rgba(226,75,74,0.12)', color: '#E24B4A' },
  }
  const s = styles[sentiment] ?? { bg: 'rgba(255,255,255,0.06)', color: '#666' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 500, padding: '2px 7px',
      borderRadius: 100, background: s.bg, color: s.color,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor' }} />
      {count}
    </span>
  )
}

export function InsightsClient({
  templates,
  selectedTemplateId,
  selectedTemplateName,
  realSessionCount,
  insight,
}: {
  templates: Template[]
  selectedTemplateId: string
  selectedTemplateName: string
  realSessionCount: number
  insight: Insight | null
}) {
  const router = useRouter()
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null)
  const [showTemplateMenu, setShowTemplateMenu] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const content = insight?.content ?? null
  const hasEnoughSessions = realSessionCount >= MIN_SESSIONS

  async function handleGenerate() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/insights/${selectedTemplateId}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to generate insights')
      router.refresh()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setGenerating(false)
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
        .main { padding: 36px 44px; max-width: 1100px; font-family: var(--font); }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .page-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .header-right { display: flex; align-items: center; gap: 10px; }
        
        .template-selector { position: relative; }
        .template-btn { display: flex; align-items: center; gap: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; color: var(--ink); cursor: pointer; font-family: var(--font); transition: border-color 0.15s; }
        .template-btn:hover { border-color: rgba(255,255,255,0.15); }
        .template-label { font-size: 11px; color: var(--ink-faint); margin-right: 2px; }
        .template-menu { position: absolute; top: calc(100% + 4px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; min-width: 200px; z-index: 10; }
        .template-option { padding: 10px 14px; font-size: 13px; color: var(--ink-muted); cursor: pointer; transition: background 0.1s; }
        .template-option:hover { background: rgba(255,255,255,0.04); color: var(--ink); }
        .template-option.active { color: var(--ink); font-weight: 500; }

        .gen-btn { font-family: var(--font); font-size: 13px; font-weight: 500; padding: 8px 18px; background: var(--ink); color: #111; border: none; border-radius: 100px; cursor: pointer; transition: opacity 0.15s; }
        .gen-btn:hover:not(:disabled) { opacity: 0.85; }
        .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .gen-btn.secondary { background: var(--surface); color: var(--ink-muted); border: 1px solid var(--border); }
        .gen-meta { font-size: 11px; color: var(--ink-faint); }
        .gen-error { font-size: 12px; color: #E24B4A; }

        .signal-banner { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; display: flex; gap: 20px; align-items: center; }
        .signal-item { display: flex; flex-direction: column; gap: 4px; }
        .signal-label { font-size: 10px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .signal-value { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .signal-divider { width: 1px; height: 36px; background: rgba(255,255,255,0.06); flex-shrink: 0; }
        .signal-pills { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .signal-pill { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 100px; }
        .pill-teal { background: rgba(61,191,160,0.12); color: #3DBFA0; }
        .pill-amber { background: rgba(239,159,39,0.12); color: #EF9F27; }
        .pill-gray { background: rgba(255,255,255,0.06); color: #666; }
        .strength-bar { display: flex; gap: 2px; align-items: center; }
        .strength-seg { width: 20px; height: 4px; border-radius: 2px; }
        .strength-on { background: #3DBFA0; }
        .strength-off { background: rgba(255,255,255,0.08); }
        .strength-label { font-size: 11px; font-weight: 500; margin-left: 6px; }

        .section { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
        .section-header { padding: 14px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center; }
        .section-title { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; }
        .section-sub { font-size: 11px; color: var(--ink-faint); }

        .q-row { padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s; }
        .q-row:last-child { border-bottom: none; }
        .q-row:hover { background: rgba(255,255,255,0.02); }
        .q-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 12px; }
        .q-label { font-size: 11px; font-weight: 600; color: #777; text-transform: uppercase; letter-spacing: 0.07em; flex: 1; }
        .q-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .q-chevron { font-size: 12px; color: #333; }
        .q-synthesis { font-size: 13px; color: #ccc; line-height: 1.65; }
        .q-skip { font-size: 11px; color: var(--ink-faint); margin-top: 6px; }

        .citations { padding: 4px 20px 12px; }
        .citation { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .citation:last-child { border-bottom: none; }
        .citation-name { font-size: 11px; color: var(--ink-faint); min-width: 90px; padding-top: 2px; flex-shrink: 0; }
        .citation-quote { font-size: 12px; color: #666; font-style: italic; line-height: 1.6; flex: 1; }
        .citation-link { font-size: 11px; color: var(--teal); cursor: pointer; white-space: nowrap; padding-top: 2px; flex-shrink: 0; transition: opacity 0.15s; }
        .citation-link:hover { opacity: 0.7; }

        .themes-grid { padding: 16px 20px; display: flex; flex-wrap: wrap; gap: 8px; }
        .theme-pill { display: flex; align-items: center; gap: 6px; background: var(--surface2); border: 1px solid var(--border); border-radius: 100px; padding: 7px 14px; cursor: pointer; transition: border-color 0.15s; }
        .theme-pill:hover { border-color: rgba(255,255,255,0.15); }
        .theme-pill.active { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .theme-count { font-size: 12px; font-weight: 600; color: var(--teal); }
        .theme-name { font-size: 12px; color: #888; }
        .theme-expanded { padding: 0 20px 16px; border-top: 1px solid rgba(255,255,255,0.04); }
        .theme-description { font-size: 13px; color: #ccc; line-height: 1.65; padding: 14px 0 10px; }

        .sess-table { width: 100%; }
        .sess-header { display: grid; grid-template-columns: 1fr 100px 100px 80px 50px; gap: 12px; padding: 10px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .sess-col { font-size: 10px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .sess-row { display: grid; grid-template-columns: 1fr 100px 100px 80px 50px; gap: 12px; padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.1s; align-items: center; }
        .sess-row:last-child { border-bottom: none; }
        .sess-row:hover { background: rgba(255,255,255,0.02); }
        .sess-name { font-size: 13px; font-weight: 500; color: var(--ink); }
        .sess-date { font-size: 11px; color: var(--ink-faint); margin-top: 1px; }
        .sess-badge { font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 100px; display: inline-block; }
        .sess-link { font-size: 11px; color: var(--teal); cursor: pointer; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.01em; }
        .empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; max-width: 360px; margin-bottom: 24px; }
        .empty-warning { font-size: 12px; color: #EF9F27; margin-top: 8px; }
      `}</style>

      <div className="main">
        <div className="page-header">
          <div className="page-title">Insights</div>
          <div className="header-right">
            {templates.length > 1 && (
              <div className="template-selector">
                <button
                  className="template-btn"
                  onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                >
                  <span className="template-label">Interview</span>
                  {selectedTemplateName}
                  <span style={{ color: '#444', fontSize: 10 }}>▾</span>
                </button>
                {showTemplateMenu && (
                  <div className="template-menu">
                    {templates.map(t => (
                      <div
                        key={t.id}
                        className={`template-option ${t.id === selectedTemplateId ? 'active' : ''}`}
                        onClick={() => {
                          setShowTemplateMenu(false)
                          router.push(`/dashboard/insights?template=${t.id}`)
                        }}
                      >
                        {t.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {insight && (
              <span className="gen-meta">
                Generated {timeAgo(insight.generatedAt)} · {insight.sessionCount} sessions
              </span>
            )}

            {hasEnoughSessions ? (
              <button
                className={`gen-btn ${insight ? 'secondary' : ''}`}
                onClick={handleGenerate}
                disabled={generating}
              >
                {generating ? 'Generating...' : insight ? 'Regenerate' : 'Generate insights'}
              </button>
            ) : null}
          </div>
        </div>

        {generateError && <p className="gen-error" style={{ marginBottom: 16 }}>{generateError}</p>}

        {!hasEnoughSessions ? (
          <div className="empty-state">
            <div className="empty-title">Not enough responses yet</div>
            <div className="empty-sub">
              Collect at least {MIN_SESSIONS} real responses before generating insights.
              You currently have {realSessionCount}.
            </div>
          </div>
        ) : !insight ? (
          <div className="empty-state">
            <div className="empty-title">No insights generated yet</div>
            <div className="empty-sub">
              You have {realSessionCount} responses ready to analyze.
              Generate insights to see a synthesis across all sessions.
            </div>
            {realSessionCount < 10 && (
              <p className="empty-warning">
                Fewer than 10 responses — insights may not be fully representative.
              </p>
            )}
            <button
              className="gen-btn"
              onClick={handleGenerate}
              disabled={generating}
              style={{ marginTop: 8 }}
            >
              {generating ? 'Generating...' : 'Generate insights'}
            </button>
          </div>
        ) : (
          <>
            {/* Signal banner */}
            <div className="signal-banner">
              <div className="signal-item">
                <div className="signal-label">Sessions analyzed</div>
                <div className="signal-value">{insight.sessionCount}</div>
              </div>
              <div className="signal-divider" />
              <div className="signal-item">
                <div className="signal-label">Response quality</div>
                <div className="signal-pills">
                  {content!.completionQualityDistribution.rich > 0 && (
                    <span className="signal-pill pill-teal">{content!.completionQualityDistribution.rich} rich</span>
                  )}
                  {content!.completionQualityDistribution.adequate > 0 && (
                    <span className="signal-pill pill-amber">{content!.completionQualityDistribution.adequate} adequate</span>
                  )}
                  {content!.completionQualityDistribution.thin > 0 && (
                    <span className="signal-pill pill-gray">{content!.completionQualityDistribution.thin} thin</span>
                  )}
                </div>
              </div>
              <div className="signal-divider" />
              <div className="signal-item">
                <div className="signal-label">Sentiment</div>
                <div className="signal-pills">
                  {content!.sentimentDistribution.positive > 0 && (
                    <span className="signal-pill pill-teal">{content!.sentimentDistribution.positive} positive</span>
                  )}
                  {content!.sentimentDistribution.mixed > 0 && (
                    <span className="signal-pill pill-amber">{content!.sentimentDistribution.mixed} mixed</span>
                  )}
                  {content!.sentimentDistribution.negative > 0 && (
                    <span className="signal-pill pill-gray" style={{ color: '#E24B4A', background: 'rgba(226,75,74,0.12)' }}>{content!.sentimentDistribution.negative} negative</span>
                  )}
                </div>
              </div>
              <div className="signal-divider" />
              <div className="signal-item">
                <div className="signal-label">Signal strength</div>
                <div className="strength-bar">
                  {['strong', 'moderate', 'limited'].map((level, i) => {
                    const filled = content!.signalStrength === 'strong' ? 3
                      : content!.signalStrength === 'moderate' ? 2 : 1
                    return (
                      <div
                        key={level}
                        className={`strength-seg ${i < filled ? 'strength-on' : 'strength-off'}`}
                      />
                    )
                  })}
                  <span
                    className="strength-label"
                    style={{
                      color: content!.signalStrength === 'strong' ? '#3DBFA0'
                           : content!.signalStrength === 'moderate' ? '#EF9F27'
                           : '#666'
                    }}
                  >
                    {content!.signalStrength.charAt(0).toUpperCase() + content!.signalStrength.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Question synthesis */}
            {content!.questionSummaries.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-title">Question synthesis</span>
                </div>
                {content!.questionSummaries.map(q => (
                  <div key={q.questionText}>
                    <div
                      className="q-row"
                      onClick={() => setExpandedQuestion(
                        expandedQuestion === q.questionText ? null : q.questionText
                      )}
                    >
                      <div className="q-top">
                        <div className="q-label">{q.questionText}</div>
                        <div className="q-right">
                          <div style={{ display: 'flex', gap: 4 }}>
                            {q.sentimentDistribution.positive > 0 && (
                              <SentimentPill sentiment="positive" count={q.sentimentDistribution.positive} />
                            )}
                            {q.sentimentDistribution.mixed > 0 && (
                              <SentimentPill sentiment="mixed" count={q.sentimentDistribution.mixed} />
                            )}
                            {q.sentimentDistribution.negative > 0 && (
                              <SentimentPill sentiment="negative" count={q.sentimentDistribution.negative} />
                            )}
                          </div>
                          <span className="q-chevron">
                            {expandedQuestion === q.questionText ? '↑' : '↓'}
                          </span>
                        </div>
                      </div>
                      <div className="q-synthesis">{q.synthesis}</div>
                      {q.skipCount > 0 && (
                        <div className="q-skip">{q.skipCount} respondent{q.skipCount === 1 ? '' : 's'} skipped this question</div>
                      )}
                    </div>
                    {expandedQuestion === q.questionText && (
                      <div className="citations">
                        {q.citations.map((c, i) => (
                          <div className="citation" key={i}>
                            <div className="citation-name">{c.respondentName ?? 'Anonymous'}</div>
                            <div className="citation-quote">&ldquo;{c.quote}&rdquo;</div>
                            <div
                              className="citation-link"
                              onClick={() => router.push(`/dashboard/sessions/${c.sessionId}`)}
                            >
                              ↗ session
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Emerging themes */}
            {content!.themes.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <span className="section-title">Emerging themes</span>
                  <span className="section-sub">{content!.themes.length} themes across {insight.sessionCount} sessions</span>
                </div>
                <div className="themes-grid">
                  {content!.themes
                    .sort((a, b) => b.sessionCount - a.sessionCount)
                    .map(theme => (
                      <div
                        key={theme.title}
                        className={`theme-pill ${expandedTheme === theme.title ? 'active' : ''}`}
                        onClick={() => setExpandedTheme(
                          expandedTheme === theme.title ? null : theme.title
                        )}
                        style={{
                          padding: theme.sessionCount >= 5 ? '9px 18px' : '7px 14px',
                        }}
                      >
                        <span className="theme-count">{theme.sessionCount}</span>
                        <span className="theme-name" style={{
                          fontSize: theme.sessionCount >= 5 ? 13 : 12,
                          color: theme.sessionCount >= 5 ? '#ccc' : '#888',
                        }}>
                          {theme.title}
                        </span>
                      </div>
                    ))}
                </div>
                {expandedTheme && (() => {
                  const theme = content!.themes.find(t => t.title === expandedTheme)
                  if (!theme) return null
                  return (
                    <div className="theme-expanded">
                      <div className="theme-description">{theme.description}</div>
                      <div className="citations">
                        {theme.citations.map((c, i) => (
                          <div className="citation" key={i}>
                            <div className="citation-name">{c.respondentName ?? 'Anonymous'}</div>
                            <div className="citation-quote">&ldquo;{c.quote}&rdquo;</div>
                            <div
                              className="citation-link"
                              onClick={() => router.push(`/dashboard/sessions/${c.sessionId}`)}
                            >
                              ↗ session
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}