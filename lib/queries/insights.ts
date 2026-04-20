import { db } from '@/lib/db'

export type Citation = {
  sessionId: string
  respondentName: string | null
  quote: string
  sentiment: string | null
  selectionReason: string
}

export type QuestionSummary = {
  questionText: string
  synthesis: string
  skipCount: number
  sentimentDistribution: { positive: number; mixed: number; negative: number }
  citations: Citation[]
}

export type Theme = {
  title: string
  description: string
  sessionCount: number
  citations: Citation[]
}

export type InsightContent = {
  questionSummaries: QuestionSummary[]
  themes: Theme[]
  sentimentDistribution: { positive: number; mixed: number; negative: number }
  signalStrength: 'strong' | 'moderate' | 'limited'
  completionQualityDistribution: { rich: number; adequate: number; thin: number }
}

export type InsightRecord = {
  id: string
  generatedAt: string
  sessionCount: number
  content: InsightContent
}

export type InsightsTemplateEntry = {
  id: string
  name: string
  realSessionCount: number
  insight: InsightRecord | null
}

export type InsightsPageData = {
  templates: InsightsTemplateEntry[]
}

const templateSessionsInclude = {
  linkTokens: {
    include: {
      sessions: {
        where: { status: 'completed' as const },
        include: {
          transcriptTurns: {
            where: { speaker: 'user' as const },
            select: { id: true },
          },
        },
      },
    },
  },
} as const

function realSessionCountForTemplate(t: {
  linkTokens: { sessions: { transcriptTurns: { id: string }[] }[] }[]
}): number {
  return t.linkTokens
    .flatMap(lt => lt.sessions)
    .filter(s => s.transcriptTurns.length > 0).length
}

function shapeInsight(
  row: { id: string; generatedAt: Date; sessionCount: number; content: unknown } | undefined,
): InsightRecord | null {
  if (!row) return null
  return {
    id: row.id,
    generatedAt: row.generatedAt.toISOString(),
    sessionCount: row.sessionCount,
    content: row.content as InsightContent,
  }
}

/** Full insights page: all active templates with counts and latest insight each. */
export async function getInsightsPageData(
  userId: string,
): Promise<InsightsPageData | null> {
  const company = await db.company.findFirst({
    where: { userId },
    include: {
      templates: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        include: {
          insights: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
          ...templateSessionsInclude,
        },
      },
    },
  })

  if (!company) return null

  const templates: InsightsTemplateEntry[] = company.templates.map(t => ({
    id: t.id,
    name: t.name,
    realSessionCount: realSessionCountForTemplate(t),
    insight: shapeInsight(t.insights[0]),
  }))

  return { templates }
}

/** Single template slice for refresh / tab prefetch. Verifies company ownership. */
export async function getInsightForTemplate(
  templateId: string,
  userId: string,
): Promise<InsightsTemplateEntry | null> {
  const template = await db.template.findFirst({
    where: { id: templateId },
    include: {
      company: true,
      insights: {
        orderBy: { generatedAt: 'desc' },
        take: 1,
      },
      ...templateSessionsInclude,
    },
  })

  if (!template || template.company.userId !== userId) return null

  return {
    id: template.id,
    name: template.name,
    realSessionCount: realSessionCountForTemplate(template),
    insight: shapeInsight(template.insights[0]),
  }
}
