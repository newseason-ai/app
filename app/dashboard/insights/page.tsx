import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInsightsPageData } from '@/lib/queries/insights'
import { InsightsClient } from './insights-client'

export default async function InsightsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getInsightsPageData(user.id)
  if (!data) redirect('/onboarding')
  if (data.templates.length === 0) redirect('/dashboard')

  return <InsightsClient initialData={data} />
}
