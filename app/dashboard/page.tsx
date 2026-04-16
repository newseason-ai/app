import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { StatCard } from './stat-card'
import { InterviewList } from './interview-list'
import { NewInterviewButton } from './new-interview-button'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const company = await db.company.findFirst({
    where: { userId: user.id },
    include: {
      templates: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!company) redirect('/onboarding')

  const hasTemplates = company.templates.length > 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #111113;
          --surface: #1E1E20;
          --surface2: #1A1A1C;
          --ink: #ffffff;
          --ink-muted: #666;
          --ink-faint: #444;
          --border: rgba(255,255,255,0.07);
          --teal: #3DBFA0;
          --font: 'Inter', system-ui, sans-serif;
        }
        html, body { min-height: 100vh; background: var(--bg); }
        .layout { font-family: var(--font); background: var(--bg); min-height: 100vh; display: grid; grid-template-columns: 220px 1fr; }

        .sidebar { background: #0D0D0F; border-right: 1px solid var(--border); padding: 20px 0; display: flex; flex-direction: column; }
        .sb-logo { font-size: 14px; font-weight: 600; color: var(--ink); padding: 0 20px 20px; border-bottom: 1px solid var(--border); margin-bottom: 8px; letter-spacing: -0.01em; }
        .sb-logo span { color: var(--ink-faint); font-weight: 400; }
        .sb-section { font-size: 11px; font-weight: 500; color: #333; text-transform: uppercase; letter-spacing: 0.08em; padding: 12px 20px 6px; }
        .sb-item { display: flex; align-items: center; gap: 8px; padding: 8px 20px; color: var(--ink-muted); cursor: pointer; font-size: 13px; transition: color 0.15s; text-decoration: none; }
        .sb-item:hover { color: var(--ink); }
        .sb-item.active { color: var(--ink); font-weight: 500; }
        .sb-item svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
        .sb-bottom { margin-top: auto; padding: 16px 20px; border-top: 1px solid var(--border); }
        .sb-email { font-size: 12px; color: var(--ink-muted); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-signout { font-size: 12px; color: var(--ink-faint); cursor: pointer; background: none; border: none; font-family: var(--font); padding: 0; }
        .sb-signout:hover { color: var(--ink-muted); }

        .main { padding: 40px 48px; max-width: 1100px; overflow: auto; }
        .main-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .main-title { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .main-sub { font-size: 13px; color: var(--ink-faint); margin-top: 3px; }
        .new-btn { background: var(--ink); color: #111; border: none; border-radius: 100px; padding: 10px 20px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: var(--font); text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
        .new-btn:hover { opacity: 0.85; }

        .pulse-bar { display: flex; gap: 10px; margin-bottom: 24px; }
        .pulse-card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 20px; min-width: 160px; }
        .pulse-label { font-size: 11px; font-weight: 500; color: var(--ink-faint); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
        .pulse-value { font-size: 20px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
        .pulse-sub { font-size: 11px; color: var(--ink-faint); margin-top: 3px; }

        .interviews { display: grid; grid-template-columns: repeat(auto-fill, minmax(480px, 1fr)); gap: 12px; }
        .interviews-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .interviews-title { font-size: 13px; font-weight: 600; color: var(--ink); }

        .ic { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; }
        .ic-top { padding: 18px 22px 14px; border-bottom: 1px solid rgba(255,255,255,0.04); display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
        .ic-name { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 3px; letter-spacing: -0.01em; }
        .ic-prompt { font-size: 12px; color: var(--ink-faint); line-height: 1.5; }
        .ic-actions { display: flex; gap: 8px; flex-shrink: 0; align-items: center; }
        .ic-badge { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 100px; background: #0F3D2E; color: var(--teal); }
        .ic-send { background: rgba(255,255,255,0.07); border: none; border-radius: 100px; padding: 7px 14px; font-size: 12px; font-weight: 500; color: var(--ink-muted); cursor: pointer; font-family: var(--font); transition: background 0.15s; }
        .ic-send:hover { background: rgba(255,255,255,0.12); }

        .ic-prog { padding: 12px 22px; border-bottom: 1px solid rgba(255,255,255,0.04); }
        .prog-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: var(--ink-faint); }
        .prog-bg { height: 3px; background: #222; border-radius: 100px; }
        .prog-fill { height: 100%; border-radius: 100px; background: var(--teal); }
        .prog-hint { font-size: 11px; color: var(--ink-faint); margin-top: 6px; }
        .prog-hint.ready { color: var(--teal); font-weight: 500; }

        .ic-insight { padding: 12px 22px; background: var(--surface2); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .ic-insight-text { font-size: 12px; color: var(--ink-faint); line-height: 1.5; flex: 1; }
        .ic-insight-text strong { color: #aaa; font-weight: 500; }
        .ic-insight-btn { background: var(--ink); color: #111; border: none; border-radius: 100px; padding: 7px 16px; font-size: 12px; font-weight: 500; cursor: pointer; font-family: var(--font); white-space: nowrap; }
        .ic-insight-btn.secondary { background: rgba(255,255,255,0.07); color: var(--ink-muted); }

        .ic-stats { padding: 10px 22px; display: flex; gap: 20px; }
        .ic-stat { font-size: 11px; color: var(--ink-faint); }
        .ic-stat span { color: var(--ink-muted); font-weight: 500; }

        .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 40px; text-align: center; background: var(--surface); border: 1px solid var(--border); border-radius: 14px; }
        .empty-icon { width: 48px; height: 48px; border-radius: 12px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
        .empty-icon svg { width: 20px; height: 20px; stroke: var(--ink-faint); fill: none; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; letter-spacing: -0.01em; }
        .empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; max-width: 320px; margin-bottom: 28px; }
        .empty-btn { background: var(--ink); color: #111; border: none; border-radius: 100px; padding: 12px 24px; font-size: 13px; font-weight: 500; cursor: pointer; font-family: var(--font); text-decoration: none; }
        .empty-btn:hover { opacity: 0.85; }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sb-logo">New Season <span>AI</span></div>
          <div className="sb-section">Workspace</div>
          <a href="/dashboard" className="sb-item active">
            <svg viewBox="0 0 16 16"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
            Overview
          </a>
          <a href="/dashboard/interviews" className="sb-item">
            <svg viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h7"/></svg>
            Interviews
          </a>
          <a href="/dashboard/sessions" className="sb-item">
            <svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 2"/></svg>
            Sessions
          </a>
          <a href="/dashboard/insights" className="sb-item">
            <svg viewBox="0 0 16 16"><path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5z"/></svg>
            Insights
          </a>
          <div className="sb-bottom">
            <div className="sb-email">{user.email}</div>
            <form action="/auth/signout" method="post">
              <button className="sb-signout" type="submit">Sign out</button>
            </form>
          </div>
        </aside>

        <main className="main">
          <div className="main-header">
            <div>
              <div className="main-title">{company.name}</div>
              <div className="main-sub">
                {hasTemplates ? `${company.templates.length} interview${company.templates.length === 1 ? '' : 's'}` : 'No interviews yet'}
              </div>
            </div>
            {hasTemplates && <NewInterviewButton />}
          </div>

          {hasTemplates ? (
            <>
              <div className="pulse-bar">
                <StatCard label="Responses" value={0} sub="this month" />
                <StatCard label="Links sent" value={0} sub={`across ${company.templates.length} interview${company.templates.length === 1 ? '' : 's'}`} />
                <StatCard label="Opted in" value={0} sub="for follow-up" />
              </div>

              <InterviewList templates={company.templates} />
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg viewBox="0 0 16 16"><path d="M2 4h12M2 8h12M2 12h7"/></svg>
              </div>
              <div className="empty-title">No interviews yet</div>
              <div className="empty-sub">Create your first interview to start collecting voice feedback from your customers.</div>
              <NewInterviewButton />
            </div>
          )}
        </main>
      </div>
    </>
  )
}