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
        orderBy: { createdAt: 'desc' },
        include: {
          linkTokens: {
            include: {
              sessions: {
                select: {
                  id: true,
                  status: true,
                  followUpOptIn: true,
                  startedAt: true,
                  _count: {
                    select: { transcriptTurns: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  })

  if (!company) redirect('/onboarding')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const allSessions = company.templates.flatMap(t =>
    t.linkTokens.flatMap(lt => lt.sessions)
  )

  const responsesThisMonth = allSessions.filter(s =>
    s.status === 'completed' &&
    s.startedAt >= startOfMonth &&
    s._count.transcriptTurns > 1
  ).length

  const linksSent = company.templates.reduce(
    (sum, t) => sum + t.linkTokens.length, 0
  )

  const optedIn = allSessions.filter(s => s.followUpOptIn).length

  const templateStats: Record<string, { total: number; completed: number }> =
    Object.fromEntries(
      company.templates.map(t => {
        const sessions = t.linkTokens.flatMap(lt => lt.sessions)
        const completed = sessions.filter(s =>
          s.status === 'completed' && s._count.transcriptTurns > 1
        )
        return [t.id, { total: sessions.length, completed: completed.length }]
      })
    )

  const hasTemplates = company.templates.length > 0

  return (
    <>
      <div className="layout">
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
                <StatCard label="Responses" value={responsesThisMonth} sub="this month" />
                <StatCard label="Links sent" value={linksSent} sub={`across ${company.templates.length} interview${company.templates.length === 1 ? '' : 's'}`} />
                <StatCard label="Opted in" value={optedIn} sub="for follow-up" />
              </div>

              <InterviewList templates={company.templates} templateStats={templateStats} />
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