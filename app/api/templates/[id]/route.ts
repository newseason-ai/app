import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const template = await db.template.findUnique({
    where: { id },
    include: { company: true }
  })

  if (!template || template.company.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { name, openingPrompt, context, directedQuestions } = await request.json()

  if (!name?.trim() || !openingPrompt?.trim()) {
    return NextResponse.json({ error: 'Name and opening prompt are required' }, { status: 400 })
  }

  const updated = await db.template.update({
    where: { id },
    data: {
      name: name.trim(),
      openingPrompt: openingPrompt.trim(),
      context: context?.trim() ?? null,
      directedQuestions: directedQuestions ?? [],
    }
  })

  return NextResponse.json({ template: updated })
}