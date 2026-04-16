'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  onClose: () => void
}

export function NewInterviewModal({ onClose }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [openingPrompt, setOpeningPrompt] = useState('')
  const [context, setContext] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          openingPrompt,
          context: context || null,
          directedQuestions: questions.filter(q => q.trim()),
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
          max-width: 480px;
          font-family: 'Inter', system-ui, sans-serif;
          max-height: 90vh;
          overflow-y: auto;
        }
        .nim-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .nim-eyebrow { font-size: 11px; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .nim-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #fff; }
        .nim-close { background: none; border: none; color: #444; cursor: pointer; font-size: 20px; line-height: 1; padding: 0; transition: color 0.15s; font-family: inherit; }
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
        .nim-questions { background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
        .nim-q-row { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .nim-q-row:last-child { border-bottom: none; }
        .nim-q-num { font-size: 11px; color: #444; min-width: 16px; }
        .nim-q-input { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; background: none; border: none; color: #fff; outline: none; flex: 1; }
        .nim-q-input::placeholder { color: #333; }
        .nim-q-add { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #444; background: none; border: none; cursor: pointer; font-family: inherit; padding: 10px 14px; width: 100%; text-align: left; border-top: 1px solid rgba(255,255,255,0.04); transition: color 0.15s; }
        .nim-q-add:hover { color: #888; }
        .nim-error { font-size: 13px; color: #E24B4A; }
        .nim-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 4px; }
        .nim-cancel { font-family: inherit; font-size: 13px; color: #444; background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .nim-cancel:hover { color: #888; }
        .nim-submit { font-family: inherit; font-size: 14px; font-weight: 500; padding: 12px 28px; background: #fff; color: #111; border: none; border-radius: 100px; cursor: pointer; transition: opacity 0.15s; }
        .nim-submit:hover:not(:disabled) { opacity: 0.85; }
        .nim-submit:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>

      <div className="nim-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="nim">
          <div className="nim-header">
            <div>
              <div className="nim-eyebrow">New interview</div>
              <div className="nim-title">Set up your interview</div>
            </div>
            <button className="nim-close" onClick={onClose}>×</button>
          </div>

          <form className="nim-form" onSubmit={handleSubmit}>
            <div className="nim-field">
              <label className="nim-label">Interview name</label>
              <input
                className="nim-input"
                type="text"
                placeholder="Early customer feedback"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="nim-field">
              <label className="nim-label">Opening prompt</label>
              <textarea
                className="nim-textarea"
                rows={3}
                placeholder="Hi! Thanks for being an early customer. I'd love to hear how things have been going since you signed up."
                value={openingPrompt}
                onChange={e => setOpeningPrompt(e.target.value)}
                required
              />
              <span className="nim-hint">Keep it warm and open-ended. The AI will take it from here.</span>
            </div>

            <div className="nim-field">
              <label className="nim-label">
                Product context
                <span className="nim-optional">optional</span>
              </label>
              <textarea
                className="nim-textarea"
                rows={2}
                placeholder="Background about your product and who you're speaking to..."
                value={context}
                onChange={e => setContext(e.target.value)}
              />
            </div>

            <div className="nim-field">
              <label className="nim-label">
                Directed questions
                <span className="nim-optional">optional</span>
              </label>
              <div className="nim-questions">
                {questions.map((q, i) => (
                  <div className="nim-q-row" key={i}>
                    <span className="nim-q-num">{i + 1}</span>
                    <input
                      className="nim-q-input"
                      type="text"
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
                  <button
                    type="button"
                    className="nim-q-add"
                    onClick={() => setQuestions([...questions, ''])}
                  >
                    + Add question
                  </button>
                )}
              </div>
              <span className="nim-hint">The AI will weave these in naturally. Max 5.</span>
            </div>

            {error && <p className="nim-error">{error}</p>}

            <div className="nim-footer">
              <button type="button" className="nim-cancel" onClick={onClose}>Cancel</button>
              <button className="nim-submit" type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create interview'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}