import { db } from '@/lib/db'

export type InterviewsListRow = {
  id: string
  name: string
  active: boolean
  createdAt: string
  updatedAt: string
  linkCount: number
  completedCount: number
  lastActivityAt: string | null
}

export type InterviewsData = {
  companyName: string
  interviews: InterviewsListRow[]
}

/**
 * Interview list for the operator's company. Returns null if no company exists.
 */
export async function getInterviewsData(
  userId: string,
): Promise<InterviewsData | null> {
  const company = await db.company.findFirst({
    where: { userId },
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

  if (!company) return null

  const interviews: InterviewsListRow[] = company.templates.map(t => {
    const sessions = t.linkTokens.flatMap(lt => lt.sessions)
    const realSessions = sessions.filter(
      s =>
        s.status === 'completed' &&
        s.transcriptTurns.some(turn => turn.speaker === 'user'),
    )

    return {
      id: t.id,
      name: t.name,
      active: t.active,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      linkCount: t.linkTokens.length,
      completedCount: realSessions.length,
      lastActivityAt:
        realSessions
          .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0]
          ?.startedAt.toISOString() ?? null,
    }
  })

  return {
    companyName: company.name,
    interviews,
  }
}
