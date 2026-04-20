'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { InterviewsData } from '@/lib/queries/interviews'

export const interviewsKeys = {
  all: ['interviews'] as const,
}

export async function fetchInterviews(): Promise<InterviewsData> {
  const res = await fetch('/api/interviews')
  if (!res.ok) throw new Error('Failed to load interviews')
  return res.json()
}

export function useInterviews(initialData?: InterviewsData) {
  return useQuery({
    queryKey: interviewsKeys.all,
    queryFn: fetchInterviews,
    initialData,
  })
}

export function prefetchInterviews(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: interviewsKeys.all,
    queryFn: fetchInterviews,
    staleTime: 30_000,
  })
}

export function invalidateInterviews(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: interviewsKeys.all })
}
