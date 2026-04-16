import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { SessionDetail } from './session-detail'

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const session = await db.session.findUnique({
    where: { id },
    include: {
      transcriptTurns: {
        where: {
          speaker: { not: 'system' }
        },
        orderBy: { turnIndex: 'asc' }
      },
      tags: {
        orderBy: { createdAt: 'asc' }
      },
      linkToken: {
        include: {
          template: {
            include: { company: true }
          }
        }
      }
    }
  })


  console.log('session id:', id)
  console.log('transcript turns found:', session?.transcriptTurns.length)
  console.log('raw turns:', session?.transcriptTurns)

  if (!session) notFound()
  if (session.linkToken.template.company.userId !== user.id) notFound()

  const linkToken = session.linkToken
  const template = linkToken.template
  const respondentName = (linkToken.metadata as { name?: string })?.name ?? null

  return (
    <SessionDetail
      session={{
        id: session.id,
        status: session.status,
        durationS: session.durationS,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt?.toISOString() ?? null,
        followUpOptIn: session.followUpOptIn,
        vapiCallId: session.vapiCallId,
      }}
      transcript={session.transcriptTurns.map(t => ({
        id: t.id,
        speaker: t.speaker,
        content: t.content,
        turnIndex: t.turnIndex,
        startedAtS: t.startedAtS,
      }))}
      tags={session.tags.map(t => ({
        id: t.id,
        label: t.label,
        sentiment: t.sentiment,
        sourceQuote: t.sourceQuote,
        phase: t.phase,
      }))}
      respondentName={respondentName}
      respondentRef={linkToken.respondentRef}
      respondentContext={linkToken.respondentContext}
      interviewName={template.name}
      interviewId={template.id}
      fromLabel={from ?? template.name}
    />
  )
}