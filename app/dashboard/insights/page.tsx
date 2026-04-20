import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { InsightsClient } from './insights-client'

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const { template: templateId } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const company = await db.company.findFirst({
    where: { userId: user.id },
    include: {
      templates: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        include: {
          insights: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
          linkTokens: {
            include: {
              sessions: {
                where: { status: 'completed' },
                include: {
                  transcriptTurns: {
                    where: { speaker: 'user' },
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!company) redirect('/onboarding')
  if (company.templates.length === 0) redirect('/dashboard')

  // Select active template
  const selectedTemplate = templateId
    ? company.templates.find(t => t.id === templateId) ?? company.templates[0]
    : company.templates[0]

  const latestInsight = selectedTemplate.insights[0] ?? null

  // Count real sessions
  const realSessionCount = selectedTemplate.linkTokens
    .flatMap(lt => lt.sessions)
    .filter(s => s.transcriptTurns.length > 0).length

  return (
    <InsightsClient
      templates={company.templates.map(t => ({
        id: t.id,
        name: t.name,
      }))}
      selectedTemplateId={selectedTemplate.id}
      selectedTemplateName={selectedTemplate.name}
      realSessionCount={realSessionCount}
      insight={latestInsight ? {
        id: latestInsight.id,
        generatedAt: latestInsight.generatedAt.toISOString(),
        sessionCount: latestInsight.sessionCount,
        content: latestInsight.content as any,
      } : null}
    />
  )
}