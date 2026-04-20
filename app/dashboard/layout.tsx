import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Providers } from '../providers'
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
    <Providers>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#0C0C0E',
      }}>
        <Sidebar email={user.email ?? ''} />
        <div>{children}</div>
      </div>
    </Providers>
  )
}