'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionEditor } from '@/app/dashboard/question-editor'

type Step = 'company' | 'interview'

type Question = { text: string; mode: 'verbatim' | 'guided' }

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('company')

  // Step 1 state
  const [companyName, setCompanyName] = useState('')
  const [productContext, setProductContext] = useState('')

  // Step 2 state
  const [interviewName, setInterviewName] = useState('Early customer feedback')
  const [context, setContext] = useState('')
  const [background, setBackground] = useState('')
  const [questions, setQuestions] = useState<Question[]>([{ text: '', mode: 'guided' }])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit =
    interviewName.trim().length > 0 && questions.some(q => q.text.trim().length > 0)

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) return
    setStep('interview')
  }

  async function handleInterviewSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!interviewName.trim()) return
    setLoading(true)
    setError(null)

    try {
      // Create company
      const companyRes = await fetch('/api/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          context: productContext || null,
        })
      })

      if (!companyRes.ok) {
        const data = await companyRes.json()
        throw new Error(data.error ?? 'Failed to create company')
      }

      // Create first template
      const templateRes = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: interviewName,
          context: context || null,
          background: background || null,
          directedQuestions: questions.filter(q => q.text.trim()),
        })
      })

      if (!templateRes.ok) {
        const data = await templateRes.json()
        throw new Error(data.error ?? 'Failed to create interview')
      }

      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113;
          --surface: #1E1E20;
          --surface2: #1A1A1C;
          --ink: #ffffff;
          --ink-muted: #666;
          --ink-faint: #444;
          --border: rgba(255,255,255,0.08);
          --border-hover: rgba(255,255,255,0.15);
          --teal: #3DBFA0;
        }
        html, body { min-height: 100vh; background: var(--bg); }
        .page { font-family: var(--font); background: var(--bg); min-height: 100vh; display: grid; grid-template-rows: auto 1fr; }
        .nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 40px; border-bottom: 1px solid var(--border); }
        .logo { font-size: 14px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; }
        .logo span { color: var(--ink-faint); font-weight: 400; }
        .nav-step { font-size: 12px; color: var(--ink-faint); }
        .main { display: flex; align-items: center; justify-content: center; padding: 48px 24px; }
        .card { width: 100%; max-width: 480px; }
        .step-indicator { display: flex; align-items: center; gap: 0; margin-bottom: 40px; }
        .s-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .s-dot.done { background: var(--teal); }
        .s-dot.active { background: var(--ink); }
        .s-dot.inactive { background: #333; }
        .s-line { flex: 1; height: 1px; }
        .s-line.done { background: var(--teal); }
        .s-line.inactive { background: #333; }
        .eyebrow { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; }
        .title { font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); margin-bottom: 8px; line-height: 1.1; }
        .subtitle { font-size: 14px; color: var(--ink-muted); line-height: 1.6; margin-bottom: 36px; }
        .form { display: flex; flex-direction: column; gap: 20px; }
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; }
        .optional { font-size: 10px; color: #333; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 6px; }
        .input { font-family: var(--font); font-size: 14px; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--ink); outline: none; transition: border-color 0.15s; width: 100%; }
        .input:focus { border-color: var(--border-hover); }
        .input::placeholder { color: var(--ink-faint); }
        .textarea { font-family: var(--font); font-size: 14px; padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; color: var(--ink); outline: none; transition: border-color 0.15s; width: 100%; resize: none; line-height: 1.55; }
        .textarea:focus { border-color: var(--border-hover); }
        .textarea::placeholder { color: var(--ink-faint); }
        .field-hint { font-size: 11px; color: #444; line-height: 1.5; }
        .btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
        .btn-primary { font-family: var(--font); font-size: 14px; font-weight: 500; padding: 12px 28px; background: var(--ink); color: #111; border: none; border-radius: 100px; cursor: pointer; transition: opacity 0.15s; }
        .btn-primary:hover:not(:disabled) { opacity: 0.85; }
        .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-back { font-family: var(--font); font-size: 13px; color: var(--ink-faint); background: none; border: none; cursor: pointer; transition: color 0.15s; }
        .btn-back:hover { color: var(--ink-muted); }
        .error { font-size: 13px; color: #E24B4A; margin-top: 4px; }
      `}</style>

      <div className="page">
        <nav className="nav">
          <span className="logo">New Season <span>AI</span></span>
          <span className="nav-step">Step {step === 'company' ? 1 : 2} of 2</span>
        </nav>

        <main className="main">
          <div className="card">
            <div className="step-indicator">
              <div className={`s-dot ${step === 'company' ? 'active' : 'done'}`} />
              <div className={`s-line ${step === 'interview' ? 'done' : 'inactive'}`} />
              <div className={`s-dot ${step === 'interview' ? 'active' : 'inactive'}`} />
            </div>

            {step === 'company' ? (
              <>
                <p className="eyebrow">Welcome</p>
                <h1 className="title">Tell us about your company</h1>
                <p className="subtitle">This takes about 60 seconds. You can change everything later.</p>
                <form className="form" onSubmit={handleCompanySubmit}>
                  <div className="field">
                    <label className="field-label">Company name</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Acme"
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">
                      What does your product do?
                      <span className="optional">optional</span>
                    </label>
                    <textarea
                      className="textarea"
                      rows={3}
                      placeholder="B2B SaaS for HR teams. We help companies automate their onboarding workflows."
                      value={productContext}
                      onChange={e => setProductContext(e.target.value)}
                    />
                    <span className="field-hint">Helps the AI interviewer understand context. You can refine this per interview later.</span>
                  </div>
                  <div className="btn-row">
                    <span />
                    <button className="btn-primary" type="submit">
                      Continue →
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="eyebrow">First interview</p>
                <h1 className="title">Set up your first interview</h1>
                <p className="subtitle">Name your interview and add optional context, background, and directed questions.</p>
                <form className="form" onSubmit={handleInterviewSubmit}>
                  <div className="field">
                    <label className="field-label">Interview name</label>
                    <input className="input" type="text" placeholder="Early customer feedback" value={interviewName} onChange={e => setInterviewName(e.target.value)} required autoFocus />
                  </div>

                  <div className="field">
                    <label className="field-label">
                      Context
                      <span className="optional">optional</span>
                    </label>
                    <textarea
                      className="textarea"
                      rows={2}
                      placeholder="The Acme team is improving the invoicing setup experience for new users."
                      value={context}
                      onChange={e => setContext(e.target.value)}
                    />
                    <span className="field-hint">Framed to the respondent. Sets the stage for the interview.</span>
                  </div>

                  <div className="field">
                    <label className="field-label">
                      Background
                      <span className="optional">optional</span>
                    </label>
                    <textarea
                      className="textarea"
                      rows={2}
                      placeholder="Respondents are first-time users. Probe on any friction points they mention."
                      value={background}
                      onChange={e => setBackground(e.target.value)}
                    />
                    <span className="field-hint">Silent guidance for the AI interviewer. Respondents never hear this.</span>
                  </div>

                  <div className="field">
                    <label className="field-label">Directed questions</label>
                    <QuestionEditor questions={questions} onChange={setQuestions} />
                    <span className="field-hint" style={{ marginTop: 6, display: 'block' }}>
                      Guided = AI covers in its own words. Verbatim = asked word for word.
                    </span>
                  </div>
                  {error && <p className="error">{error}</p>}
                  <div className="btn-row">
                    <button type="button" className="btn-back" onClick={() => setStep('company')}>
                      ← Back
                    </button>
                    <button className="btn-primary" type="submit" disabled={loading || !canSubmit}>
                      {loading ? 'Setting up...' : 'Go to dashboard →'}
                    </button>
                  </div>
                  <p style={{ textAlign: 'center', marginTop: '16px' }}>
                    <a href="/dashboard" style={{ fontSize: '12px', color: '#444', textDecoration: 'none', borderBottom: '1px solid #333', paddingBottom: '1px' }}>
                      Not sure yet? Skip this and set up your first interview from the dashboard.
                    </a>
                  </p>
                </form>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  )
}