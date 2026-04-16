import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from './sidebar'
import './dashboard.css'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif',
      background: '#111113',
    }}>
      <Sidebar email={user.email ?? ''} />
      <div>{children}</div>
    </div>
  )
}