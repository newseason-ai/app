'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { InterviewData } from '@/lib/queries/interview'

export const interviewKeys = {
  all: ['interview'] as const,
  detail: (id: string) => ['interview', id] as const,
}

export async function fetchInterview(id: string): Promise<InterviewData> {
  const res = await fetch(`/api/interviews/${id}`)
  if (!res.ok) throw new Error('Failed to load interview')
  return res.json()
}

export function useInterview(id: string, initialData?: InterviewData) {
  return useQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => fetchInterview(id),
    initialData,
  })
}

export function prefetchInterview(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: interviewKeys.detail(id),
    queryFn: () => fetchInterview(id),
    staleTime: 30_000,
  })
}

export function invalidateInterview(queryClient: QueryClient, id: string) {
  return queryClient.invalidateQueries({ queryKey: interviewKeys.detail(id) })
}
