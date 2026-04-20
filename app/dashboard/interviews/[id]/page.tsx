import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getInterviewData } from '@/lib/queries/interview'
import { InterviewDetail } from '@/app/dashboard/interviews/[id]/interview-detail'

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const data = await getInterviewData(id, user.id)
  if (!data) notFound()

  return <InterviewDetail id={id} initialData={data} />
}