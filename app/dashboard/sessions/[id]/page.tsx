import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionData } from '@/lib/queries/session'
import { SessionDetail } from './session-detail'

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { id } = await params
  const { from } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getSessionData(id, user.id)
  if (!data) notFound()

  return (
    <SessionDetail
      id={id}
      initialData={data}
      fromLabel={from ?? data.interviewName}
    />
  )
}
