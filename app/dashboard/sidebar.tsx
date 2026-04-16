'use client'

import { usePathname } from 'next/navigation'

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
  exact?: boolean
}

const items: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    exact: true,
    icon: (
      <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <rect x="2" y="2" width="5" height="5" rx="1"/>
        <rect x="9" y="2" width="5" height="5" rx="1"/>
        <rect x="2" y="9" width="5" height="5" rx="1"/>
        <rect x="9" y="9" width="5" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/interviews',
    label: 'Interviews',
    icon: (
      <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <path d="M2 4h12M2 8h12M2 12h7"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/insights',
    label: 'Insights',
    icon: (
      <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
        <path d="M8 2l1.5 4.5H14l-3.5 2.5 1.5 4.5L8 11l-4 2.5 1.5-4.5L2 6.5h4.5z"/>
      </svg>
    ),
  },
]

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname()

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href
    if (item.href === '/dashboard/interviews') {
      return pathname.startsWith('/dashboard/interviews') ||
             pathname.startsWith('/dashboard/sessions')
    }
    return pathname.startsWith(item.href)
  }

  return (
    <aside style={{
      background: '#0D0D0F',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      <div style={{
        fontSize: 14, fontWeight: 600, color: '#fff',
        padding: '0 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        marginBottom: 8,
        letterSpacing: '-0.01em',
      }}>
        New Season <span style={{ color: '#444', fontWeight: 400 }}>AI</span>
      </div>

      <div style={{
        fontSize: 11, fontWeight: 500, color: '#333',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        padding: '12px 20px 6px',
      }}>
        Workspace
      </div>

      {items.map(item => {
        const active = isActive(item)
        return (
          <a
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 20px',
              color: active ? '#fff' : '#666',
              fontWeight: active ? 500 : 400,
              fontSize: 13,
              textDecoration: 'none',
              transition: 'color 0.15s',
            }}
          >
            {item.icon}
            {item.label}
          </a>
        )
      })}

      <div style={{
        marginTop: 'auto',
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{
          fontSize: 12, color: '#666', marginBottom: 6,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {email}
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{
            fontSize: 12, color: '#444', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}>
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}