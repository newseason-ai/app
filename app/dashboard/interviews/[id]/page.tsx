import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { InterviewDetail } from '@/app/dashboard/interviews/[id]/interview-detail'

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const template = await db.template.findUnique({
    where: { id },
    include: {
      company: true,
      linkTokens: {
        orderBy: { createdAt: 'desc' },
        include: {
          sessions: {
            orderBy: { startedAt: 'desc' },
            select: {
              id: true,
              status: true,
              durationS: true,
              startedAt: true,
              endedAt: true,
              followUpOptIn: true,
            }
          }
        }
      }
    }
  })

  if (!template || template.company.userId !== user.id) notFound()

  const links = template.linkTokens.map(lt => {
    const session = lt.sessions.find(s => s.status === 'completed')
      ?? lt.sessions[0]
      ?? null
    const now = new Date()

    let status: 'pending' | 'completed' | 'abandoned' | 'expired'
    if (session?.status === 'completed') status = 'completed'
    else if (session?.status === 'abandoned') status = 'abandoned'
    else if (lt.expiresAt < now) status = 'expired'
    else status = 'pending'

    return {
      id: lt.id,
      token: lt.token,
      respondentName: (lt.metadata as { name?: string })?.name ?? null,
      respondentRef: lt.respondentRef,
      respondentContext: lt.respondentContext,
      createdAt: lt.createdAt.toISOString(),
      expiresAt: lt.expiresAt.toISOString(),
      status,
      session: session ? {
        id: session.id,
        status: session.status,
        durationS: session.durationS,
        startedAt: session.startedAt.toISOString(),
        followUpOptIn: session.followUpOptIn,
      } : null,
    }
  })

  return (
    <InterviewDetail
      template={{
        id: template.id,
        name: template.name,
        openingPrompt: template.openingPrompt,
        context: template.context,
        directedQuestions: template.directedQuestions as string[],
        targetDurationS: template.targetDurationS,
        active: template.active,
        createdAt: template.createdAt.toISOString(),
      }}
      links={links}
      companyName={template.company.name}
    />
  )
}