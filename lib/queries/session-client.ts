'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { SessionData } from '@/lib/queries/session'

export const sessionKeys = {
  detail: (id: string) => ['session', id] as const,
}

export async function fetchSession(id: string): Promise<SessionData> {
  const res = await fetch(`/api/dashboard/sessions/${id}`)
  if (!res.ok) throw new Error('Failed to load session')
  return res.json()
}

export function useSession(id: string, initialData?: SessionData) {
  return useQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => fetchSession(id),
    initialData,
  })
}

export function prefetchSession(queryClient: QueryClient, id: string) {
  return queryClient.prefetchQuery({
    queryKey: sessionKeys.detail(id),
    queryFn: () => fetchSession(id),
    staleTime: 30_000,
  })
}

export function invalidateSession(queryClient: QueryClient, id: string) {
  return queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) })
}
