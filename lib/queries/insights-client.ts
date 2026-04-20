'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { InsightsPageData, InsightsTemplateEntry } from '@/lib/queries/insights'

export const insightsKeys = {
  all: ['insights'] as const,
  page: ['insights', 'page'] as const,
  template: (templateId: string) => ['insights', templateId] as const,
}

export async function fetchInsightsPage(): Promise<InsightsPageData> {
  const res = await fetch('/api/insights/page')
  if (!res.ok) throw new Error('Failed to load insights')
  return res.json()
}

export async function fetchInsightForTemplate(
  templateId: string,
): Promise<InsightsTemplateEntry> {
  const res = await fetch(`/api/insights/template/${templateId}`)
  if (!res.ok) throw new Error('Failed to load insight')
  return res.json()
}

export function useInsightsPage(initialData?: InsightsPageData) {
  return useQuery({
    queryKey: insightsKeys.page,
    queryFn: fetchInsightsPage,
    initialData,
  })
}

export function useInsight(templateId: string, initialData?: InsightsTemplateEntry) {
  return useQuery({
    queryKey: insightsKeys.template(templateId),
    queryFn: () => fetchInsightForTemplate(templateId),
    initialData,
    enabled: Boolean(templateId),
  })
}

export function prefetchInsight(queryClient: QueryClient, templateId: string) {
  return queryClient.prefetchQuery({
    queryKey: insightsKeys.template(templateId),
    queryFn: () => fetchInsightForTemplate(templateId),
    staleTime: 30_000,
  })
}

export function invalidateInsight(queryClient: QueryClient, templateId: string) {
  return queryClient.invalidateQueries({
    queryKey: insightsKeys.template(templateId),
  })
}

export function invalidateInsightsPage(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: insightsKeys.page })
}
