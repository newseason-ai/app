'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F2F0EB;
          --surface: #FFFFFF;
          --ink: #111110;
          --ink-muted: #6B6B68;
          --ink-faint: #ADADAA;
          --border: rgba(0,0,0,0.08);
          --error: #C0392B;
          --font: 'Inter', system-ui, sans-serif;
        }

        html, body { height: 100%; background: var(--bg); }

        .login-page {
          font-family: var(--font);
          background: var(--bg);
          min-height: 100vh;
          display: grid;
          grid-template-rows: auto 1fr;
        }

        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 56px;
          border-bottom: 1px solid var(--border);
        }

        .logo {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
          text-decoration: none;
        }

        .logo span { color: var(--ink-muted); font-weight: 400; }

        .nav-back {
          font-size: 14px;
          color: var(--ink-muted);
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 100px;
          transition: background 0.15s;
        }

        .nav-back:hover { background: rgba(0,0,0,0.05); }

        .main {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 48px;
          width: 100%;
          max-width: 400px;
        }

        .card-eyebrow {
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .card-title {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 8px;
        }

        .card-sub {
          font-size: 14px;
          color: var(--ink-muted);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .input {
          font-family: var(--font);
          font-size: 14px;
          padding: 13px 18px;
          border: 1px solid var(--border);
          border-radius: 100px;
          background: var(--bg);
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
          width: 100%;
        }

        .input:focus { border-color: rgba(0,0,0,0.25); }
        .input::placeholder { color: var(--ink-faint); }

        .submit-btn {
          font-family: var(--font);
          font-size: 14px;
          font-weight: 500;
          padding: 13px 24px;
          background: var(--ink);
          color: white;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          transition: opacity 0.15s;
          width: 100%;
        }

        .submit-btn:hover:not(:disabled) { opacity: 0.8; }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .error-msg {
          font-size: 13px;
          color: var(--error);
          padding: 0 4px;
        }

        .divider {
          border: none;
          border-top: 1px solid var(--border);
          margin: 28px 0;
        }

        .card-hint {
          font-size: 12px;
          color: var(--ink-faint);
          text-align: center;
          line-height: 1.6;
        }

        .card-hint a {
          color: var(--ink-muted);
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* Success state */
        .success-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #E8F5F0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
        }

        .success-title {
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
          margin-bottom: 8px;
        }

        .success-sub {
          font-size: 14px;
          color: var(--ink-muted);
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .success-sub strong {
          color: var(--ink);
          font-weight: 500;
        }

        .resend-btn {
          font-family: var(--font);
          font-size: 14px;
          color: var(--ink-muted);
          background: none;
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 11px 24px;
          cursor: pointer;
          width: 100%;
          transition: background 0.15s;
        }

        .resend-btn:hover { background: var(--bg); }
      `}</style>

      <div className="login-page">
        <nav className="nav">
          <a href="/" className="logo">New Season <span>AI</span></a>
          <a href="/" className="nav-back">← Back to home</a>
        </nav>

        <main className="main">
          {submitted ? (
            <div className="card">
              <div className="success-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#2D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4,10 8,14 16,6" />
                </svg>
              </div>
              <h1 className="success-title">Check your email</h1>
              <p className="success-sub">
                We sent a magic link to <strong>{email}</strong>. Click it to sign in — it expires in 10 minutes.
              </p>
              <button
                className="resend-btn"
                onClick={() => setSubmitted(false)}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <div className="card">
              <p className="card-eyebrow">Operator access</p>
              <h1 className="card-title">Sign in</h1>
              <p className="card-sub">
                Enter your email and we&apos;ll send you a magic link — no password needed.
              </p>
              <form className="form" onSubmit={handleSubmit}>
                <input
                  className="input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                />
                <button className="submit-btn" type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send magic link'}
                </button>
                {error && <p className="error-msg">{error}</p>}
              </form>
              <hr className="divider" />
              <p className="card-hint">
                Don&apos;t have access yet?{' '}
                <a href="/">Request early access</a>
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  )
}