'use client'

import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Clock, Calendar,
  AlertTriangle, FileText, QrCode, LogOut,
} from 'lucide-react'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { logout } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const itemsNav = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icone: LayoutDashboard },
  { label: 'Employés',   href: '/admin/employes',   icone: Users           },
  { label: 'Pointages',  href: '/admin/pointages',  icone: Clock           },
  { label: 'Congés',     href: '/admin/conges',     icone: Calendar        },
  { label: 'Anomalies',  href: '/admin/anomalies',  icone: AlertTriangle   },
  { label: 'Rapports',   href: '/admin/rapports',   icone: FileText        },
  { label: 'QR Code',    href: '/admin/qr-display',     icone: QrCode          },
]

interface Props {
  nomUtilisateur?: string
}

export default function AdminSidebar({ nomUtilisateur }: Props) {
  const pathname = usePathname()

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  const initiale = nomUtilisateur?.[0]?.toUpperCase() ?? 'A'

  return (
    <aside
      className="w-64 flex flex-col fixed h-full z-10 border-r"
      style={{
        backgroundColor: 'var(--pp-sidebar-bg)',
        borderColor: 'var(--pp-sidebar-border)',
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5 border-b"
        style={{ borderColor: 'var(--pp-sidebar-border)' }}
      >
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: 'var(--pp-text-muted)' }}
        >
          Menu
        </p>
        {itemsNav.map(item => {
          const actif = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn('relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm')}
              style={{
                backgroundColor: actif ? 'var(--pp-nav-active-bg)' : 'transparent',
                color: actif ? 'var(--pp-nav-active-fg)' : 'var(--pp-nav-fg)',
                fontWeight: actif ? 500 : 400,
              }}
              onMouseEnter={e => {
                if (!actif) e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)'
              }}
              onMouseLeave={e => {
                if (!actif) e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {actif && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                  style={{ backgroundColor: 'var(--pp-accent)' }}
                />
              )}
              <item.icone size={16} strokeWidth={2} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Bas de sidebar */}
      <div
        className="px-3 py-4 border-t space-y-1"
        style={{ borderColor: 'var(--pp-sidebar-border)' }}
      >
        {/* Avatar utilisateur (Lien vers profil) */}
        <a 
          href="/admin/profil"
          className="flex items-center gap-3 px-3 py-2 mb-1 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: 'var(--pp-accent)' }}
          >
            {initiale}
          </div>
          <div className="min-w-0">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--pp-text-primary)' }}
            >
              {nomUtilisateur ?? 'Admin'}
            </p>
            <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
              Administrateur
            </p>
          </div>
        </a>
      </div>
    </aside>
  )
}
