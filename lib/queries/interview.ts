import { db } from '@/lib/db'

export type Question = { text: string; mode: 'verbatim' | 'guided' }

export type LinkStatus =
  | 'pending'
  | 'completed'
  | 'no_response'
  | 'abandoned'
  | 'expired'

export type LinkRow = {
  id: string
  token: string
  respondentName: string | null
  respondentRef: string | null
  respondentContext: string | null
  createdAt: string
  expiresAt: string
  status: LinkStatus
  session: {
    id: string
    status: string
    durationS: number | null
    startedAt: string
    followUpOptIn: boolean
  } | null
}

export type InterviewData = {
  template: {
    id: string
    name: string
    context: string | null
    background: string | null
    directedQuestions: Question[]
    targetDurationS: number | null
    active: boolean
    createdAt: string
  }
  links: LinkRow[]
  companyName: string
}

/**
 * Fetches interview detail data for a given template, scoped to the operator's company.
 * Returns null if not found or the user doesn't have access.
 */
export async function getInterviewData(
  templateId: string,
  userId: string,
): Promise<InterviewData | null> {
  const template = await db.template.findUnique({
    where: { id: templateId },
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
              transcriptTurns: {
                select: { speaker: true },
              },
            },
          },
        },
      },
    },
  })

  if (!template || template.company.userId !== userId) return null

  const now = new Date()

  const links: LinkRow[] = template.linkTokens.map(lt => {
    const session =
      lt.sessions.find(s => s.status === 'completed') ?? lt.sessions[0] ?? null

    const hasUserTurn = lt.sessions.some(s =>
      s.transcriptTurns.some(t => t.speaker === 'user'),
    )

    let status: LinkStatus
    if (!session) {
      status = lt.expiresAt < now ? 'expired' : 'pending'
    } else if (session.status === 'completed' && hasUserTurn) {
      status = 'completed'
    } else if (session.status === 'completed' && !hasUserTurn) {
      status = 'no_response'
    } else if (session.status === 'abandoned') {
      status = 'abandoned'
    } else {
      status = lt.expiresAt < now ? 'expired' : 'pending'
    }

    return {
      id: lt.id,
      token: lt.token,
      respondentName: (lt.metadata as { name?: string })?.name ?? null,
      respondentRef: lt.respondentRef,
      respondentContext: lt.respondentContext,
      createdAt: lt.createdAt.toISOString(),
      expiresAt: lt.expiresAt.toISOString(),
      status,
      session: session
        ? {
            id: session.id,
            status: session.status,
            durationS: session.durationS,
            startedAt: session.startedAt.toISOString(),
            followUpOptIn: session.followUpOptIn,
          }
        : null,
    }
  })

  return {
    template: {
      id: template.id,
      name: template.name,
      context: template.context,
      background: template.background,
      directedQuestions: template.directedQuestions as Question[],
      targetDurationS: template.targetDurationS,
      active: template.active,
      createdAt: template.createdAt.toISOString(),
    },
    links,
    companyName: template.company.name,
  }
}