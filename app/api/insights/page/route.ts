import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInsightsPageData } from '@/lib/queries/insights'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await getInsightsPageData(user.id)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}
