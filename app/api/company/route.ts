import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name, context } = await request.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
  }

  // Check if user already has a company
  const existing = await db.company.findFirst({
    where: { userId: user.id }
  })

  if (existing) {
    return NextResponse.json({ error: 'Company already exists' }, { status: 409 })
  }

  // Generate a unique slug
  let slug = slugify(name)
  const slugExists = await db.company.findUnique({ where: { slug } })
  if (slugExists) {
    slug = `${slug}-${Date.now()}`
  }

  const company = await db.company.create({
    data: {
      name: name.trim(),
      slug,
      userId: user.id,
    }
  })

  return NextResponse.json({ company })
}