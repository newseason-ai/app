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
      findings: {
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
        sentiment: session.sentiment,
        completionQuality: session.completionQuality,
      }}
      transcript={session.transcriptTurns.map(t => ({
        id: t.id,
        speaker: t.speaker,
        content: t.content,
        turnIndex: t.turnIndex,
        startedAtS: t.startedAtS,
      }))}
      findings={session.findings.map(f => ({
        id: f.id,
        questionText: f.questionText,
        title: f.title,
        synthesis: f.synthesis,
        evidence: f.evidence,
        sentiment: f.sentiment,
        turnIndex: f.turnIndex,
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