'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionEditor } from './question-editor'

type Question = { text: string; mode: 'verbatim' | 'guided' }

type Props = {
  onClose: () => void
}

export function NewInterviewModal({ onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [context, setContext] = useState('')
  const [background, setBackground] = useState('')
  const [questions, setQuestions] = useState<Question[]>([{ text: '', mode: 'guided' }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && questions.some(q => q.text.trim().length > 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          context: context || null,
          background: background || null,
          directedQuestions: questions.filter(q => q.text.trim()),
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create interview')
      }

      router.refresh()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .nim-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 24px;
        }
        .nim {
          background: #1E1E20;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 640px;
          font-family: 'Inter', system-ui, sans-serif;
          max-height: 90vh;
          overflow-y: auto;
        }
        .nim-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
        .nim-eyebrow { font-size: 11px; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.08em; }
        .nim-title-input {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #fff;
          background: none;
          border: none;
          outline: none;
          width: 100%;
          padding: 0;
          margin-top: 4px;
        }
        .nim-title-input::placeholder { color: #2a2a2a; }
        .nim-close { background: none; border: none; color: #444; cursor: pointer; font-size: 20px; line-height: 1; padding: 0; transition: color 0.15s; font-family: inherit; flex-shrink: 0; }
        .nim-close:hover { color: #888; }
        .nim-form { display: flex; flex-direction: column; gap: 18px; }
        .nim-field { display: flex; flex-direction: column; gap: 6px; }
        .nim-label { font-size: 11px; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.06em; }
        .nim-optional { font-size: 10px; color: #333; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 6px; }
        .nim-input { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; padding: 11px 14px; background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; outline: none; transition: border-color 0.15s; width: 100%; }
        .nim-input:focus { border-color: rgba(255,255,255,0.2); }
        .nim-input::placeholder { color: #333; }
        .nim-textarea { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; padding: 11px 14px; background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; outline: none; transition: border-color 0.15s; width: 100%; resize: none; line-height: 1.55; }
        .nim-textarea:focus { border-color: rgba(255,255,255,0.2); }
        .nim-textarea::placeholder { color: #333; }
        .nim-hint { font-size: 11px; color: #333; line-height: 1.5; }
        .nim-error { font-size: 13px; color: #E24B4A; }
        .nim-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .nim-cancel { font-family: inherit; font-size: 13px; color: #444; background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .nim-cancel:hover { color: #888; }
        .nim-submit { font-family: inherit; font-size: 14px; font-weight: 500; padding: 12px 28px; background: #fff; color: #111; border: none; border-radius: 100px; cursor: pointer; transition: opacity 0.15s; }
        .nim-submit:hover:not(:disabled) { opacity: 0.85; }
        .nim-submit:disabled { opacity: 0.3; cursor: not-allowed; }
      `}</style>

      <div className="nim-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="nim">
          <div className="nim-header">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="nim-eyebrow">New interview</div>
              <input
                className="nim-title-input"
                type="text"
                placeholder="Interview name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button className="nim-close" onClick={onClose}>×</button>
          </div>

          <form className="nim-form" onSubmit={handleSubmit}>
            <div className="nim-field">
              <label className="nim-label">
                Context
                <span className="nim-optional">optional</span>
              </label>
              <textarea
                className="nim-textarea"
                rows={2}
                placeholder="The Acme team is improving the invoicing setup experience for new users."
                value={context}
                onChange={e => setContext(e.target.value)}
              />
              <span className="nim-hint">Framed to the respondent. Sets the stage for the interview.</span>
            </div>

            <div className="nim-field">
              <label className="nim-label">
                Background
                <span className="nim-optional">optional</span>
              </label>
              <textarea
                className="nim-textarea"
                rows={2}
                placeholder="Respondents are first-time users who signed up in the last 30 days. Probe on setup friction."
                value={background}
                onChange={e => setBackground(e.target.value)}
              />
              <span className="nim-hint">Silent behavioral guidance for the AI. Respondents never hear this.</span>
            </div>

            <div className="nim-field">
              <label className="nim-label">Directed questions</label>
              <QuestionEditor questions={questions} onChange={setQuestions} />
              <span className="nim-hint" style={{ marginTop: 6, display: 'block' }}>Without verbatim, our interviewer will honor the intent of each question but adapt the phrasing for natural conversation.              </span>
            </div>

            {error && <p className="nim-error">{error}</p>}

            <div className="nim-footer">
              <button type="button" className="nim-cancel" onClick={onClose}>Cancel</button>
              <button className="nim-submit" type="submit" disabled={loading || !canSubmit}>
                {loading ? 'Creating...' : 'Create interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}