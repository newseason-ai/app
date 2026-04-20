import { db } from '@/lib/db'

/** Target completed responses for progress display (15 responses = 100% progress bar). */
export const SIGNAL_THRESHOLD = 15

export type DashboardInterview = {
  id: string
  name: string
  context: string | null
  completed: number
  progressPct: number
  remaining: number
  hasInsight: boolean
  insightGeneratedAt: string | null
  topThemes: string[]
  sentiment: { positive: number; mixed: number; negative: number }
}

export type DashboardData = {
  companyName: string
  responsesThisMonth: number
  linksSent: number
  optedIn: number
  interviews: DashboardInterview[]
}

/**
 * Loads dashboard pulse stats and interview list for the operator's company.
 * Returns null if the user has no company (caller should redirect to onboarding).
 */
export async function getDashboardData(
  userId: string,
): Promise<DashboardData | null> {
  const company = await db.company.findFirst({
    where: { userId },
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

  if (!company) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const allSessions = company.templates.flatMap(t =>
    t.linkTokens.flatMap(lt => lt.sessions),
  )
  const responsesThisMonth = allSessions.filter(
    s =>
      s.status === 'completed' &&
      s.startedAt >= startOfMonth &&
      s.transcriptTurns.some(t => t.speaker === 'user'),
  ).length
  const linksSent = company.templates.reduce(
    (sum, t) => sum + t.linkTokens.length,
    0,
  )
  const optedIn = allSessions.filter(s => s.followUpOptIn).length

  const interviews: DashboardInterview[] = company.templates.map(t => {
    const sessions = t.linkTokens.flatMap(lt => lt.sessions)
    const completed = sessions.filter(
      s =>
        s.status === 'completed' &&
        s.transcriptTurns.some(turn => turn.speaker === 'user'),
    )
    const latestInsight = t.insights[0] ?? null
    const topThemes = latestInsight
      ? (latestInsight.content as { themes?: { title: string }[] })?.themes
          ?.slice(0, 3)
          ?.map(th => th.title) ?? []
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

    const progressPct = Math.min(
      (completed.length / SIGNAL_THRESHOLD) * 100,
      100,
    )

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

  return {
    companyName: company.name,
    responsesThisMonth,
    linksSent,
    optedIn,
    interviews,
  }
}
