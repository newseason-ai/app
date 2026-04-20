import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInsightForTemplate } from '@/lib/queries/insights'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ templateId: string }> },
) {
  const { templateId } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await getInsightForTemplate(templateId, user.id)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json(data)
}
