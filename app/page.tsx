"use client";

import { useState, useEffect } from "react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #F2F0EB;
          --surface: #FFFFFF;
          --ink: #111110;
          --ink-muted: #6B6B68;
          --ink-faint: #ADADAA;
          --accent: #111110;
          --border: rgba(0,0,0,0.08);
          --teal: #3DBFA0;
          --px: 24px;
        }

        @media (min-width: 640px) {
          :root { --px: 40px; }
        }
        @media (min-width: 1024px) {
          :root { --px: 56px; }
        }

        html { background: var(--bg); }

        .page {
          font-family: var(--font);
          background: var(--bg);
          color: var(--ink);
          min-height: 100vh;
          opacity: ${mounted ? 1 : 0};
          transition: opacity 0.3s ease;
        }

        /* ── Nav ── */
        .nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px var(--px);
          border-bottom: 1px solid var(--border);
        }

        .logo {
          font-size: 15px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
        }
        .logo span { color: var(--ink-muted); font-weight: 400; }

        .nav-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .nav-link {
          font-size: 14px;
          font-weight: 400;
          color: var(--ink-muted);
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 100px;
          transition: background 0.15s;
          text-decoration: none;
          display: none;
        }
        @media (min-width: 640px) { .nav-link { display: block; } }

        .nav-btn {
          font-family: var(--font);
          font-size: 14px;
          font-weight: 500;
          color: var(--ink);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 8px 20px;
          cursor: pointer;
          transition: background 0.15s;
          text-decoration: none;
        }
        .nav-btn:hover { background: #F7F7F7; }

        /* ── Hero ── */
        .hero {
          display: grid;
          grid-template-columns: 1fr;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .hero { grid-template-columns: 1fr 1fr; min-height: calc(100vh - 73px); }
        }

        .hero-left {
          padding: 48px var(--px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 40px;
        }
        @media (min-width: 900px) {
          .hero-left {
            padding: 72px var(--px);
            border-right: 1px solid var(--border);
            gap: 0;
          }
        }

        .hero-top {}

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-muted);
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 100px;
          padding: 5px 12px;
          margin-bottom: 24px;
        }
        @media (min-width: 640px) { .badge { margin-bottom: 32px; } }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--teal);
        }

        .hero-h1 {
          font-size: clamp(30px, 6vw, 56px);
          font-weight: 600;
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: var(--ink);
          margin-bottom: 16px;
        }
        @media (min-width: 640px) { .hero-h1 { margin-bottom: 24px; } }

        .hero-sub {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--ink-muted);
          margin-bottom: 32px;
          max-width: 480px;
        }
        @media (min-width: 640px) { .hero-sub { font-size: 17px; margin-bottom: 40px; } }

        .cta-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 12px;
        }
        @media (min-width: 480px) {
          .cta-form { flex-direction: row; max-width: 400px; }
        }

        .cta-input {
          flex: 1;
          font-family: var(--font);
          font-size: 15px;
          padding: 14px 18px;
          border: 1px solid var(--border);
          border-radius: 100px;
          background: var(--surface);
          color: var(--ink);
          outline: none;
          transition: border-color 0.15s;
          min-width: 0;
        }
        @media (min-width: 640px) { .cta-input { font-size: 14px; padding: 13px 18px; } }
        .cta-input:focus { border-color: rgba(0,0,0,0.3); }
        .cta-input::placeholder { color: var(--ink-faint); }

        .cta-btn {
          font-family: var(--font);
          font-size: 15px;
          font-weight: 500;
          padding: 14px 24px;
          background: var(--ink);
          color: white;
          border: none;
          border-radius: 100px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s;
          text-align: center;
        }
        @media (min-width: 640px) { .cta-btn { font-size: 14px; padding: 13px 24px; } }
        .cta-btn:hover { opacity: 0.8; }

        .cta-hint {
          font-size: 12px;
          color: var(--ink-faint);
        }

        .cta-success {
          font-size: 14px;
          color: var(--ink-muted);
          padding: 13px 0;
        }

        .hero-stats {
          display: flex;
          gap: 32px;
          padding-top: 32px;
          border-top: 1px solid var(--border);
          flex-wrap: wrap;
        }
        @media (min-width: 640px) { .hero-stats { gap: 40px; padding-top: 48px; } }

        .stat-label {
          font-size: 12px;
          color: var(--ink-faint);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: var(--ink);
        }
        @media (min-width: 640px) { .stat-value { font-size: 24px; } }

        /* ── Hero right / demo ── */
        .hero-right {
          padding: 40px var(--px);
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .hero-right { padding: 72px var(--px); border-top: none; }
        }

        .demo-wrap {
          width: 100%;
          max-width: 320px;
        }

        .demo-label {
          font-size: 12px;
          color: var(--ink-faint);
          margin-bottom: 16px;
          text-align: center;
        }

        .demo-phone {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 24px;
          overflow: hidden;
          padding: 28px 24px 24px;
        }

        .demo-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .demo-company {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .demo-chip {
          background: var(--teal);
          color: white;
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .demo-byline {
          font-size: 10px;
          color: var(--ink-faint);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .demo-headline {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.2;
          color: var(--ink);
          margin-bottom: 10px;
        }

        .demo-desc {
          font-size: 13px;
          color: var(--ink-muted);
          line-height: 1.55;
          margin-bottom: 16px;
        }

        .demo-meta {
          display: flex;
          gap: 14px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }

        .demo-meta-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: var(--ink-muted);
        }

        .demo-card {
          background: var(--surface);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 108px;
        }

        .demo-card-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 4px;
        }

        .demo-card-body {
          font-size: 12px;
          color: var(--ink-muted);
          line-height: 1.5;
        }

        .demo-start-btn {
          width: 100%;
          padding: 13px;
          background: var(--ink);
          color: white;
          border: none;
          border-radius: 100px;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 500;
          cursor: default;
          letter-spacing: -0.01em;
        }

        .demo-powered {
          text-align: center;
          font-size: 11px;
          color: var(--ink-faint);
          margin-top: 12px;
        }

        /* ── How it works ── */
        .how {
          display: grid;
          grid-template-columns: 1fr;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .how { grid-template-columns: 280px 1fr; }
        }

        .how-sidebar {
          padding: 48px var(--px) 32px;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .how-sidebar {
            padding: 64px var(--px);
            border-bottom: none;
            border-right: 1px solid var(--border);
          }
        }

        .section-eyebrow {
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-faint);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .section-title {
          font-size: clamp(22px, 3vw, 28px);
          font-weight: 600;
          letter-spacing: -0.02em;
          line-height: 1.15;
          color: var(--ink);
        }

        .how-steps {
          padding: 0 var(--px);
          display: grid;
          grid-template-columns: 1fr;
        }
        @media (min-width: 640px) {
          .how-steps { grid-template-columns: 1fr 1fr; }
        }

        .step {
          padding: 36px 0;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 640px) {
          .step {
            padding: 48px 40px 48px 0;
          }
          .step:nth-child(even) {
            padding-left: 40px;
            padding-right: 0;
            border-left: 1px solid var(--border);
          }
          .step:nth-last-child(-n+2) { border-bottom: none; }
        }
        @media (min-width: 640px) and (max-width: 899px) {
          /* on tablet, last two still have borders removed but single-col stacking */
        }
        /* On mobile, only last step loses its bottom border */
        @media (max-width: 639px) {
          .step:last-child { border-bottom: none; }
        }

        .step-num {
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-faint);
          margin-bottom: 12px;
        }

        .step h3 {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin-bottom: 8px;
        }

        .step p {
          font-size: 14px;
          color: var(--ink-muted);
          line-height: 1.6;
        }

        /* ── Features ── */
        .features {
          border-bottom: 1px solid var(--border);
          padding: 48px var(--px);
        }
        @media (min-width: 640px) { .features { padding: 64px var(--px); } }

        .features-header { margin-bottom: 32px; }
        @media (min-width: 640px) { .features-header { margin-bottom: 40px; } }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        @media (min-width: 900px) {
          .features-grid { grid-template-columns: repeat(4, 1fr); gap: 12px; }
        }

        .feature-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px 16px;
          transition: border-color 0.15s;
        }
        @media (min-width: 640px) { .feature-card { padding: 28px 24px; } }
        .feature-card:hover { border-color: rgba(0,0,0,0.15); }

        .feature-num {
          font-size: 12px;
          font-weight: 500;
          color: var(--ink-faint);
          margin-bottom: 20px;
        }
        @media (min-width: 640px) { .feature-num { margin-bottom: 32px; } }

        .feature-card h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          margin-bottom: 6px;
          letter-spacing: -0.01em;
        }
        @media (min-width: 640px) { .feature-card h4 { font-size: 15px; margin-bottom: 8px; } }

        .feature-card p {
          font-size: 13px;
          color: var(--ink-muted);
          line-height: 1.6;
        }

        /* ── Footer CTA ── */
        .footer-cta {
          display: grid;
          grid-template-columns: 1fr;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .footer-cta { grid-template-columns: 1fr 1fr; }
        }

        .footer-left {
          padding: 48px var(--px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }
        @media (min-width: 900px) {
          .footer-left {
            padding: 72px var(--px);
            border-bottom: none;
            border-right: 1px solid var(--border);
            gap: 0;
          }
        }

        .footer-left h2 {
          font-size: clamp(36px, 6vw, 48px);
          font-weight: 600;
          letter-spacing: -0.03em;
          line-height: 1.05;
          color: var(--ink);
        }

        .footer-tagline {
          font-size: 14px;
          color: var(--ink-faint);
        }

        .footer-right {
          padding: 48px var(--px);
          background: var(--ink);
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 20px;
        }
        @media (min-width: 640px) { .footer-right { padding: 72px var(--px); gap: 24px; } }

        .footer-right p {
          font-size: 15px;
          color: rgba(255,255,255,0.5);
          line-height: 1.65;
          max-width: 360px;
        }

        .footer-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 360px;
        }
        @media (min-width: 480px) { .footer-form { flex-direction: row; } }

        .footer-input {
          flex: 1;
          font-family: var(--font);
          font-size: 15px;
          padding: 14px 18px;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 100px;
          background: rgba(255,255,255,0.07);
          color: white;
          outline: none;
          transition: border-color 0.15s;
          min-width: 0;
        }
        @media (min-width: 640px) { .footer-input { font-size: 14px; padding: 13px 18px; } }
        .footer-input::placeholder { color: rgba(255,255,255,0.25); }
        .footer-input:focus { border-color: rgba(255,255,255,0.35); }

        .footer-btn {
          font-family: var(--font);
          font-size: 15px;
          font-weight: 500;
          padding: 14px 24px;
          background: white;
          color: var(--ink);
          border: none;
          border-radius: 100px;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.15s;
          text-align: center;
        }
        @media (min-width: 640px) { .footer-btn { font-size: 14px; padding: 13px 24px; } }
        .footer-btn:hover { opacity: 0.85; }

        .footer-success {
          font-size: 14px;
          color: rgba(255,255,255,0.5);
        }

        /* ── Bottom bar ── */
        .bottom-bar {
          padding: 18px var(--px);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .bottom-logo {
          font-size: 14px;
          font-weight: 600;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .bottom-copy {
          font-size: 12px;
          color: var(--ink-faint);
        }
      `}</style>

      <div className="page">
        <nav className="nav">
          <span className="logo">New Season <span>AI</span></span>
          <div className="nav-right">
            <span className="nav-link">How it works</span>
            <a href="/login" className="nav-btn">Sign in</a>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-left">
            <div className="hero-top">
              <div className="badge">
                <div className="badge-dot" />
                Now in early access
              </div>
              <h1 className="hero-h1">Customer feedback that actually gets done</h1>
              <p className="hero-sub">
                Send a link. Your customer talks for 90 seconds. Get transcripts, themes, and insights — no scheduling, no surveys.
              </p>
              {submitted ? (
                <p className="cta-success">You&apos;re on the list — we&apos;ll be in touch soon.</p>
              ) : (
                <>
                  <form className="cta-form" onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true); }}>
                    <input
                      className="cta-input"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button className="cta-btn" type="submit">Get early access</button>
                  </form>
                  <p className="cta-hint">For early-stage startups. No credit card required.</p>
                </>
              )}
            </div>
            <div className="hero-stats">
              <div>
                <p className="stat-label">Interview length</p>
                <p className="stat-value">~90s</p>
              </div>
              <div>
                <p className="stat-label">Setup time</p>
                <p className="stat-value">2 min</p>
              </div>
              <div>
                <p className="stat-label">No app needed</p>
                <p className="stat-value">Ever</p>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="demo-wrap">
              <p className="demo-label">What your respondent sees</p>
              <div className="demo-phone">
                <div className="demo-top-row">
                  <div>
                    <p className="demo-company">Acme</p>
                    <p className="demo-byline">with newseason.ai</p>
                  </div>
                  <span className="demo-chip">2 min</span>
                </div>
                <h2 className="demo-headline">Help shape what we build next</h2>
                <p className="demo-desc">We&apos;d love to hear what&apos;s working and what&apos;s on your mind — in your own words.</p>
                <div className="demo-meta">
                  <div className="demo-meta-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="5.5"/><polyline points="6.5,3.5 6.5,6.5 8.5,8"/></svg>
                    ~2 min
                  </div>
                  <div className="demo-meta-item">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="4" y="1" width="5" height="8" rx="2.5"/><path d="M2 9c0 2.5 9 2.5 9 0"/><line x1="6.5" y1="11" x2="6.5" y2="12.5"/></svg>
                    Voice conversation
                  </div>
                </div>
                <div className="demo-card">
                  <p className="demo-card-title">Your feedback shapes the product</p>
                  <p className="demo-card-body">You invested in Acme — tell us what matters most to you and we&apos;ll build it.</p>
                </div>
                <button className="demo-start-btn">Start conversation</button>
                <p className="demo-powered">Powered by voice AI · your feedback goes to Acme</p>
              </div>
            </div>
          </div>
        </section>

        <section className="how">
          <div className="how-sidebar">
            <p className="section-eyebrow">How it works</p>
            <h2 className="section-title">From idea to insight in minutes</h2>
          </div>
          <div className="how-steps">
            {[
              { n: "01", title: "Create your interview", body: "Set interview context and background, add a few directed questions, and describe who you're speaking to." },
              { n: "02", title: "Send a link", body: "Generate a unique link per respondent. No app, no account, no friction on their end." },
              { n: "03", title: "AI conducts the call", body: "A natural voice conversation, ~90 seconds. Respondents talk in their own words, on their own time." },
              { n: "04", title: "Read the insights", body: "Transcripts, auto-tagged themes, and synthesized insights land in your dashboard automatically." },
            ].map((s) => (
              <div className="step" key={s.n}>
                <p className="step-num">{s.n}</p>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="features">
          <div className="features-header">
            <p className="section-eyebrow">Why teams use it</p>
            <h2 className="section-title">Built for signal, not busywork</h2>
          </div>
          <div className="features-grid">
            {[
              { n: "01", title: "Higher completion", body: "Voice is faster and more natural than a form. Respondents actually finish." },
              { n: "02", title: "No scheduling", body: "Async by default. Respondents go at their own pace, whenever suits them." },
              { n: "03", title: "Auto-tagged themes", body: "Sentiment and key themes extracted from every session. No manual analysis." },
              { n: "04", title: "Your brand", body: "Respondents see your company name and prompt. New Season stays behind the scenes." },
            ].map((f) => (
              <div className="feature-card" key={f.n}>
                <p className="feature-num">{f.n}</p>
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="footer-cta">
          <div className="footer-left">
            <h2>Real signal,<br />fast.</h2>
            <p className="footer-tagline">Built for early-stage startups.</p>
          </div>
          <div className="footer-right">
            <p>For teams who need to understand their customers without the overhead of traditional research.</p>
            {submitted ? (
              <p className="footer-success">You&apos;re on the list — we&apos;ll be in touch soon.</p>
            ) : (
              <form className="footer-form" onSubmit={(e) => { e.preventDefault(); if (email) setSubmitted(true); }}>
                <input
                  className="footer-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button className="footer-btn" type="submit">Request access</button>
              </form>
            )}
          </div>
        </section>

        <div className="bottom-bar">
          <span className="bottom-logo">New Season AI</span>
          <span className="bottom-copy">© 2026 New Season AI</span>
        </div>
      </div>
    </>
  );
}