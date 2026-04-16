import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { InterviewsClient } from './interviews-client'

export default async function InterviewsPage() {
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
                  startedAt: true,
                }
              }
            }
          }
        }
      }
    }
  })

  if (!company) redirect('/onboarding')

  const interviews = company.templates.map(t => {
    const sessions = t.linkTokens.flatMap(lt => lt.sessions)
    const completed = sessions.filter(s => s.status === 'completed')
    const lastSession = sessions.sort((a, b) =>
      b.startedAt.getTime() - a.startedAt.getTime()
    )[0] ?? null

    return {
      id: t.id,
      name: t.name,
      openingPrompt: t.openingPrompt,
      active: t.active,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      linkCount: t.linkTokens.length,
      sessionCount: sessions.length,
      completedCount: completed.length,
      lastActivityAt: lastSession?.startedAt.toISOString() ?? null,
    }
  })

  return <InterviewsClient interviews={interviews} />
}