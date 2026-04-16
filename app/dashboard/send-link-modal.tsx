'use client'

import { useState } from 'react'
import QRCode from 'qrcode'

type Props = {
  templateId: string
  templateName: string
  onClose: () => void
}

export function SendLinkModal({ templateId, templateName, onClose }: Props) {
  const [respondentName, setRespondentName] = useState('')
  const [respondentContext, setRespondentContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [url, setUrl] = useState<string | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          respondentName: respondentName || null,
          respondentContext: respondentContext || null,
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to generate link')
      }

      const data = await res.json()
      setUrl(data.url)

      const qr = await QRCode.toDataURL(data.url, {
        width: 200,
        margin: 2,
        color: {
          dark: '#111113',
          light: '#ffffff',
        }
      })
      setQrUrl(qr)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for non-HTTPS or browsers that block clipboard access
      const el = document.createElement('textarea')
      el.value = url
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <style>{`
        .modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex; align-items: center; justify-content: center;
          z-index: 50; padding: 24px;
        }
        .modal {
          background: #1E1E20;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 32px;
          width: 100%;
          max-width: 440px;
          max-height: 90vh;
          overflow-y: auto;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .modal-eyebrow { font-size: 11px; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
        .modal-title { font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #fff; }
        .modal-close { background: none; border: none; color: #444; cursor: pointer; font-size: 20px; line-height: 1; padding: 0; transition: color 0.15s; font-family: inherit; }
        .modal-close:hover { color: #888; }
        .modal-form { display: flex; flex-direction: column; gap: 16px; }
        .modal-field { display: flex; flex-direction: column; gap: 6px; }
        .modal-label { font-size: 11px; font-weight: 500; color: #444; text-transform: uppercase; letter-spacing: 0.06em; }
        .modal-optional { font-size: 10px; color: #333; font-weight: 400; text-transform: none; letter-spacing: 0; margin-left: 6px; }
        .modal-input { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; padding: 11px 14px; background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; outline: none; transition: border-color 0.15s; width: 100%; }
        .modal-input:focus { border-color: rgba(255,255,255,0.2); }
        .modal-input::placeholder { color: #333; }
        .modal-textarea { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; padding: 11px 14px; background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; color: #fff; outline: none; transition: border-color 0.15s; width: 100%; resize: none; line-height: 1.5; }
        .modal-textarea:focus { border-color: rgba(255,255,255,0.2); }
        .modal-textarea::placeholder { color: #333; }
        .modal-hint { font-size: 11px; color: #333; line-height: 1.5; }
        .modal-expiry { font-size: 11px; color: #333; padding: 10px 0 0; }
        .modal-btn { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; font-weight: 500; padding: 12px 24px; background: #fff; color: #111; border: none; border-radius: 100px; cursor: pointer; width: 100%; transition: opacity 0.15s; margin-top: 4px; }
        .modal-btn:hover:not(:disabled) { opacity: 0.85; }
        .modal-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .modal-error { font-size: 13px; color: #E24B4A; }
        .modal-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 4px 0; }
        .link-box { background: #111113; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
        .link-url { font-size: 12px; color: #666; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: 'Inter', monospace; }
        .copy-btn { font-family: 'Inter', system-ui, sans-serif; font-size: 12px; font-weight: 500; padding: 7px 14px; background: #fff; color: #111; border: none; border-radius: 100px; cursor: pointer; white-space: nowrap; flex-shrink: 0; transition: opacity 0.15s; }
        .copy-btn:hover { opacity: 0.85; }
        .copy-btn.copied { background: #0F3D2E; color: #3DBFA0; }
        .link-success-label { font-size: 12px; color: #3DBFA0; font-weight: 500; margin-bottom: 10px; }
        .link-meta { font-size: 11px; color: #333; margin-top: 8px; }
        .modal-done-btn { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; color: #444; background: none; border: none; cursor: pointer; width: 100%; margin-top: 16px; transition: color 0.15s; }
        .modal-done-btn:hover { color: #888; }
      `}</style>

      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
        <div className="modal">
          <div className="modal-header">
            <div>
              <div className="modal-eyebrow">Send link</div>
              <div className="modal-title">{templateName}</div>
            </div>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>

          {!url ? (
            <form className="modal-form" onSubmit={handleGenerate}>
              <div className="modal-field">
                <label className="modal-label">
                  Respondent name
                  <span className="modal-optional">optional</span>
                </label>
                <input
                  className="modal-input"
                  type="text"
                  placeholder="Sarah Chen"
                  value={respondentName}
                  onChange={e => setRespondentName(e.target.value)}
                />
              </div>
              <div className="modal-field">
                <label className="modal-label">
                  Respondent context
                  <span className="modal-optional">optional</span>
                </label>
                <textarea
                  className="modal-textarea"
                  rows={2}
                  placeholder="Power user, signed up 3 months ago, on the Pro plan"
                  value={respondentContext}
                  onChange={e => setRespondentContext(e.target.value)}
                />
                <span className="modal-hint">Shared with the AI interviewer to personalise the conversation.</span>
              </div>
              <div className="modal-expiry">Expires in 30 days</div>
              {error && <p className="modal-error">{error}</p>}
              <button className="modal-btn" type="submit" disabled={loading}>
                {loading ? 'Generating...' : 'Generate link'}
              </button>
            </form>
          ) : (
            <div>
              <div className="link-success-label">✓ Link ready to send</div>
              <div className="link-box">
                <span className="link-url">{url}</span>
                <button
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="link-meta">
                {respondentName && `For ${respondentName} · `}Expires in 30 days
              </div>

              {qrUrl && (
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <img
                    src={qrUrl}
                    alt="QR code"
                    style={{ width: 160, height: 160, borderRadius: 8 }}
                  />
                  <span style={{ fontSize: 11, color: '#444' }}>
                    Scan to test on mobile
                  </span>
                </div>
              )}

              <button className="modal-done-btn" onClick={onClose}>Done</button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}