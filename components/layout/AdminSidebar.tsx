'use client'

import { useRouter } from 'next/navigation'
import {
  Users, Clock, Calendar, AlertTriangle, FileText,
  QrCode, Settings, LogOut, LayoutDashboard, Sun, Moon,
} from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { logout } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const itemsNav = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icone: LayoutDashboard },
  { label: 'Employés',   href: '/admin/employes',   icone: Users },
  { label: 'Pointages',  href: '/admin/pointages',  icone: Clock },
  { label: 'Congés',     href: '/admin/conges',     icone: Calendar },
  { label: 'Anomalies',  href: '/admin/anomalies',  icone: AlertTriangle },
  { label: 'Rapports',   href: '/admin/rapports',   icone: FileText },
  { label: 'QR Code',    href: '/admin/qrcode',     icone: QrCode },
  { label: 'Paramètres', href: '/admin/parametres', icone: Settings },
]

interface Props {
  activePath: string
  nomUtilisateur?: string
}

export default function AdminSidebar({ activePath, nomUtilisateur }: Props) {
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  const deconnecter = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside
      className="w-64 flex flex-col fixed h-full z-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--pt-sidebar-bg)' }}
    >
      {/* Logo */}
      <div
        className="p-6 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--pt-accent)' }}
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-lg">PointApp</span>
        </div>
        {nomUtilisateur && (
          <p className="text-xs mt-2 truncate" style={{ color: 'var(--pt-sidebar-text)' }}>
            {nomUtilisateur}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {itemsNav.map(item => {
          const actif = activePath === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                actif ? 'text-white font-medium' : 'hover:text-white'
              )}
              style={{
                backgroundColor: actif ? 'var(--pt-accent)' : 'transparent',
                color: actif ? '#fff' : 'var(--pt-sidebar-text)',
              }}
              onMouseEnter={e => {
                if (!actif) {
                  e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'
                  e.currentTarget.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!actif) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = 'var(--pt-sidebar-text)'
                }
              }}
            >
              <item.icone size={17} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Bas de sidebar */}
      <div
        className="p-4 border-t space-y-1"
        style={{ borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* Toggle thème */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'var(--pt-sidebar-text)' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--pt-sidebar-text)'
          }}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>

        {/* Déconnexion */}
        <button
          onClick={deconnecter}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'var(--pt-sidebar-text)' }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--pt-sidebar-text)'
          }}
        >
          <LogOut size={17} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
