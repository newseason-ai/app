import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const company = await db.company.findFirst({
    where: { userId: user.id }
  })

  if (!company) {
    return NextResponse.json({ error: 'No company found' }, { status: 404 })
  }

  const { name, openingPrompt, directedQuestions, context } = await request.json()

  if (!name?.trim() || !openingPrompt?.trim()) {
    return NextResponse.json({ error: 'Name and opening prompt are required' }, { status: 400 })
  }

  const template = await db.template.create({
    data: {
      companyId: company.id,
      name: name.trim(),
      openingPrompt: openingPrompt.trim(),
      directedQuestions: directedQuestions ?? [],
      context: context?.trim() ?? null,
      targetDurationS: 90, // hardcoded for now
      active: true,
    }
  })

  return NextResponse.json({ template })
}
