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
            select: {
              id: true,
              status: true,
              durationS: true,
              startedAt: true,
            }
          }
        }
      }
    }
  })

  if (!template || template.company.userId !== user.id) notFound()

  const sessions = template.linkTokens.flatMap(lt =>
    lt.sessions.map(s => ({
      ...s,
      respondentName: (lt.metadata as { name?: string })?.name ?? null,
      respondentRef: lt.respondentRef,
    }))
  ).sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

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
      sessions={sessions.map(s => ({
        id: s.id,
        status: s.status,
        durationS: s.durationS,
        startedAt: s.startedAt.toISOString(),
        respondentName: s.respondentName,
        respondentRef: s.respondentRef,
      }))}
      companyName={template.company.name}
    />
  )
}