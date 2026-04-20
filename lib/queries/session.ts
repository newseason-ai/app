import { db } from '@/lib/db'

export type SessionTranscriptTurn = {
  id: string
  speaker: string
  content: string
  turnIndex: number
  startedAtS: number
}

export type SessionFinding = {
  id: string
  questionText: string | null
  title: string | null
  synthesis: string
  evidence: string
  sentiment: string | null
  turnIndex: number | null
}

export type SessionCore = {
  id: string
  status: string
  durationS: number | null
  startedAt: string
  endedAt: string | null
  followUpOptIn: boolean
  vapiCallId: string
  sentiment: string | null
  completionQuality: string | null
}

export type SessionData = {
  session: SessionCore
  transcript: SessionTranscriptTurn[]
  findings: SessionFinding[]
  respondentName: string | null
  respondentRef: string | null
  respondentContext: string | null
  interviewName: string
  interviewId: string
}

/**
 * Operator session detail. Returns null if missing or not owned by userId.
 */
export async function getSessionData(
  sessionId: string,
  userId: string,
): Promise<SessionData | null> {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      transcriptTurns: {
        where: {
          speaker: { not: 'system' },
        },
        orderBy: { turnIndex: 'asc' },
      },
      findings: {
        orderBy: { createdAt: 'asc' },
      },
      linkToken: {
        include: {
          template: {
            include: { company: true },
          },
        },
      },
    },
  })

  if (!session) return null
  if (session.linkToken.template.company.userId !== userId) return null

  const linkToken = session.linkToken
  const template = linkToken.template
  const respondentName = (linkToken.metadata as { name?: string })?.name ?? null

  return {
    session: {
      id: session.id,
      status: session.status,
      durationS: session.durationS,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt?.toISOString() ?? null,
      followUpOptIn: session.followUpOptIn,
      vapiCallId: session.vapiCallId,
      sentiment: session.sentiment,
      completionQuality: session.completionQuality,
    },
    transcript: session.transcriptTurns.map(t => ({
      id: t.id,
      speaker: t.speaker,
      content: t.content,
      turnIndex: t.turnIndex,
      startedAtS: t.startedAtS,
    })),
    findings: session.findings.map(f => ({
      id: f.id,
      questionText: f.questionText,
      title: f.title,
      synthesis: f.synthesis,
      evidence: f.evidence,
      sentiment: f.sentiment,
      turnIndex: f.turnIndex,
    })),
    respondentName,
    respondentRef: linkToken.respondentRef,
    respondentContext: linkToken.respondentContext,
    interviewName: template.name,
    interviewId: template.id,
  }
}
