import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { NewInterviewButton } from './new-interview-button'
import { InterviewList } from './interview-list'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const company = await db.company.findFirst({
    where: { userId: user.id },
    include: {
      templates: {
        orderBy: { createdAt: 'desc' },
        include: {
          insights: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
            select: { generatedAt: true, content: true },
          },
          linkTokens: {
            include: {
              sessions: {
                select: {
                  id: true,
                  status: true,
                  followUpOptIn: true,
                  startedAt: true,
                  sentiment: true,
                  transcriptTurns: {
                    select: { speaker: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!company) redirect('/onboarding')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const allSessions = company.templates.flatMap(t =>
    t.linkTokens.flatMap(lt => lt.sessions),
  )
  const responsesThisMonth = allSessions.filter(s =>
    s.status === 'completed' &&
    s.startedAt >= startOfMonth &&
    s.transcriptTurns.some(t => t.speaker === 'user'),
  ).length
  const linksSent = company.templates.reduce((sum, t) => sum + t.linkTokens.length, 0)
  const optedIn = allSessions.filter(s => s.followUpOptIn).length

  const interviews = company.templates.map(t => {
    const sessions = t.linkTokens.flatMap(lt => lt.sessions)
    const completed = sessions.filter(s =>
      s.status === 'completed' &&
      s.transcriptTurns.some(turn => turn.speaker === 'user'),
    )
    const latestInsight = t.insights[0] ?? null
    const topThemes = latestInsight
      ? (latestInsight.content as { themes?: { title: string }[] })?.themes?.slice(0, 3)?.map(th => th.title) ?? []
      : []

    const sentimentCounts = completed.reduce(
      (acc, s) => {
        if (s.sentiment === 'positive') acc.positive++
        else if (s.sentiment === 'mixed') acc.mixed++
        else if (s.sentiment === 'negative') acc.negative++
        return acc
      },
      { positive: 0, mixed: 0, negative: 0 },
    )

    const SIGNAL_THRESHOLD = 15
    const progressPct = Math.min((completed.length / SIGNAL_THRESHOLD) * 100, 100)

    return {
      id: t.id,
      name: t.name,
      context: t.context,
      completed: completed.length,
      progressPct,
      remaining: Math.max(SIGNAL_THRESHOLD - completed.length, 0),
      hasInsight: !!latestInsight,
      insightGeneratedAt: latestInsight?.generatedAt?.toISOString() ?? null,
      topThemes,
      sentiment: sentimentCounts,
    }
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #0C0C0E;
          --surface: #1A1A1C;
          --ink: #ffffff;
          --ink-muted: #666;
          --ink-faint: #333;
          --border: rgba(255,255,255,0.05);
          --teal: #3DBFA0;
          --font: 'Inter', system-ui, sans-serif;
        }
        html, body { min-height: 100vh; background: var(--bg); }
        .main { padding: 36px 56px; max-width: 1100px; font-family: var(--font); }

        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
        .company-name { font-size: 24px; font-weight: 600; letter-spacing: -0.03em; color: var(--ink); }
        .topbar-right { display: flex; align-items: center; gap: 20px; }
        .pulse { display: flex; }
        .pulse-item { font-size: 12px; color: #2A2A2C; padding: 0 16px; border-right: 1px solid rgba(255,255,255,0.05); }
        .pulse-item:first-child { padding-left: 0; }
        .pulse-item:last-child { border-right: none; padding-right: 0; }
        .pulse-item span { color: #666; font-weight: 500; }
        .new-btn { font-family: var(--font); font-size: 12px; font-weight: 500; color: #111; background: #fff; border: none; border-radius: 100px; padding: 8px 18px; cursor: pointer; transition: opacity 0.15s; }
        .new-btn:hover { opacity: 0.85; }

        .col-header { display: grid; gap: 0; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
        .col-header-item { font-size: 10px; font-weight: 500; color: #2A2A2C; text-transform: uppercase; letter-spacing: 0.08em; padding-left: 20px; }
        .col-header-item:first-child { padding-left: 16px; }

        .empty-state { padding: 80px 0; text-align: center; }
        .empty-title { font-size: 16px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .empty-sub { font-size: 13px; color: var(--ink-faint); line-height: 1.6; margin-bottom: 24px; }
      `}</style>

      <div className="main">
        <div className="topbar">
          <div className="company-name">{company.name}</div>
          <div className="topbar-right">
            <div className="pulse">
              <div className="pulse-item"><span>{responsesThisMonth}</span> responses this month</div>
              <div className="pulse-item"><span>{linksSent}</span> links sent</div>
              <div className="pulse-item"><span>{optedIn}</span> opted in</div>
            </div>
            <NewInterviewButton />
          </div>
        </div>

        {interviews.length > 0 ? (
          <>
            <div className="col-header" style={{ gridTemplateColumns: '1fr 110px 160px 200px' }}>
              <div className="col-header-item">Interview</div>
              <div className="col-header-item">Responses</div>
              <div className="col-header-item">Progress</div>
              <div className="col-header-item">Insights</div>
            </div>
            <InterviewList interviews={interviews} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-title">No interviews yet</div>
            <div className="empty-sub">Create your first interview to start collecting voice feedback.</div>
            <NewInterviewButton />
          </div>
        )}
      </div>
    </>
  )
}
