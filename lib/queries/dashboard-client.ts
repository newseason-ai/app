'use client'

import { useQuery, type QueryClient } from '@tanstack/react-query'
import type { DashboardData } from '@/lib/queries/dashboard'

export const dashboardKeys = {
  all: ['dashboard'] as const,
}

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/dashboard')
  if (!res.ok) throw new Error('Failed to load dashboard')
  return res.json()
}

export function useDashboard(initialData?: DashboardData) {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    initialData,
  })
}

export function prefetchDashboard(queryClient: QueryClient) {
  return queryClient.prefetchQuery({
    queryKey: dashboardKeys.all,
    queryFn: fetchDashboard,
    staleTime: 30_000,
  })
}

export function invalidateDashboard(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: dashboardKeys.all })
}
