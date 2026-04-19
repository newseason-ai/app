'use client'

import { useEffect, useRef } from 'react'

type Question = {
  text: string
  mode: 'verbatim' | 'guided'
}

type Props = {
  questions: Question[]
  onChange: (questions: Question[]) => void
  maxQuestions?: number
}

function AutoTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      className="qe-input"
      placeholder={placeholder}
      value={value}
      rows={1}
      onChange={e => onChange(e.target.value)}
    />
  )
}

export function QuestionEditor({ questions, onChange, maxQuestions = 5 }: Props) {
  function updateText(i: number, text: string) {
    const updated = [...questions]
    updated[i] = { ...updated[i], text }
    onChange(updated)
  }

  function toggleVerbatim(i: number) {
    const updated = [...questions]
    updated[i] = {
      ...updated[i],
      mode: updated[i].mode === 'verbatim' ? 'guided' : 'verbatim'
    }
    onChange(updated)
  }

  function addQuestion() {
    onChange([...questions, { text: '', mode: 'guided' }])
  }

  function removeQuestion(i: number) {
    onChange(questions.filter((_, idx) => idx !== i))
  }

  const remaining = maxQuestions - questions.length

  return (
    <>
      <style>{`
        .qe-wrap { background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; overflow: hidden; }
        .qe-row { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; align-items: flex-start; gap: 10px; }
        .qe-num { font-size: 11px; color: #444; min-width: 16px; font-family: var(--font, system-ui); flex-shrink: 0; padding-top: 2px; }
        .qe-input { font-family: var(--font, system-ui); font-size: 13px; background: none; border: none; color: #fff; outline: none; width: 100%; min-width: 0; resize: none; line-height: 1.5; overflow: hidden; padding: 0; display: block; box-sizing: border-box; }
        .qe-input::placeholder { color: #333; }
        .qe-main { flex: 1; min-width: 0; display: flex; flex-direction: row; align-items: stretch; gap: 10px; }
        .qe-text { flex: 1; min-width: 0; }
        .qe-side-actions { display: flex; flex-direction: column; align-items: flex-end; align-self: stretch; flex-shrink: 0; padding-top: 2px; }
        .qe-side-spacer { flex: 1; min-height: 4px; width: 100%; }
        .qe-verbatim-toggle { display: flex; align-items: center; gap: 3px; flex-shrink: 0; cursor: pointer; background: none; border: 1px solid rgba(255,255,255,0.08); border-radius: 100px; padding: 2px 7px; font-family: var(--font, system-ui); font-size: 10px; font-weight: 500; color: #444; transition: all 0.15s; white-space: nowrap; }
        .qe-verbatim-toggle:hover { border-color: rgba(255,255,255,0.15); color: #888; }
        .qe-verbatim-toggle.active { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.2); color: #fff; }
        .qe-toggle-dot { width: 3px; height: 3px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
        .qe-delete { background: none; border: none; color: #333; cursor: pointer; font-size: 16px; line-height: 1; padding: 0; transition: color 0.15s; flex-shrink: 0; }
        .qe-delete:hover { color: #666; }
        .qe-add-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 14px; border-top: 1px solid rgba(255,255,255,0.04); }
        .qe-add { font-size: 12px; color: #444; background: none; border: none; cursor: pointer; font-family: var(--font, system-ui); padding: 0; transition: color 0.15s; }
        .qe-add:hover { color: #888; }
        .qe-add:disabled { opacity: 0.3; cursor: not-allowed; }
        .qe-remaining { font-size: 11px; color: #333; }
      `}</style>

      <div className="qe-wrap">
        {questions.map((q, i) => (
          <div className="qe-row" key={i}>
            <span className="qe-num">{i + 1}</span>
            <div className="qe-main">
              <div className="qe-text">
                <AutoTextarea
                  value={q.text}
                  onChange={text => updateText(i, text)}
                  placeholder="Add a question..."
                />
              </div>
              <div className="qe-side-actions">
                {questions.length > 1 && (
                  <button
                    type="button"
                    className="qe-delete"
                    onClick={() => removeQuestion(i)}
                    aria-label="Remove question"
                  >
                    ×
                  </button>
                )}
                <div className="qe-side-spacer" aria-hidden />
                <button
                  type="button"
                  className={`qe-verbatim-toggle ${q.mode === 'verbatim' ? 'active' : ''}`}
                  onClick={() => toggleVerbatim(i)}
                >
                  <span className="qe-toggle-dot" />
                  Verbatim
                </button>
              </div>
            </div>
          </div>
        ))}
        <div className="qe-add-row">
          <button
            type="button"
            className="qe-add"
            onClick={addQuestion}
            disabled={questions.length >= maxQuestions}
          >
            + Add question
          </button>
          {remaining <= 3 && remaining > 0 && (
            <span className="qe-remaining">{remaining} remaining</span>
          )}
        </div>
      </div>
    </>
  )
}