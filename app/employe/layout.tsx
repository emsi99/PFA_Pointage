'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Clock, QrCode, Calendar, User, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { getUser, logout } from '@/lib/auth-client'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'

const itemsNav = [
  { label: 'Accueil',    href: '/employe/pointage',  icone: Home,     central: false },
  { label: 'Historique', href: '/employe/historique', icone: Clock,    central: false },
  { label: 'Pointer',    href: '/employe/scanner',    icone: QrCode,   central: true  },
  { label: 'Congés',     href: '/employe/conges',     icone: Calendar, central: false },
  { label: 'Profil',     href: '/employe/profil',     icone: User,     central: false },
]

function EmployeSidebar({ activePath, nomUtilisateur }: { activePath: string; nomUtilisateur?: string }) {
  const { theme, toggleTheme } = useTheme()

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  return (
    <aside
      className="w-56 flex flex-col fixed h-full z-10 border-r"
      style={{ backgroundColor: 'var(--pp-sidebar-bg)', borderColor: 'var(--pp-sidebar-border)' }}
    >
      <div className="px-5 py-5 border-b" style={{ borderColor: 'var(--pp-sidebar-border)' }}>
        <Logo />
        {nomUtilisateur && (
          <p className="text-xs mt-2 truncate" style={{ color: 'var(--pp-text-muted)' }}>
            {nomUtilisateur}
          </p>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {itemsNav.map(item => {
          const actif = activePath === item.href || activePath.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
              style={{
                backgroundColor: actif ? 'var(--pp-nav-active-bg)' : 'transparent',
                color: actif ? 'var(--pp-nav-active-fg)' : 'var(--pp-nav-fg)',
                fontWeight: actif ? 500 : 400,
              }}
              onMouseEnter={e => { if (!actif) e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
              onMouseLeave={e => { if (!actif) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              {actif && (
                <div className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ backgroundColor: 'var(--pp-accent)' }} />
              )}
              <item.icone size={16} strokeWidth={2} />
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-1" style={{ borderColor: 'var(--pp-sidebar-border)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left"
          style={{ color: 'var(--pp-nav-fg)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>
        <button
          onClick={deconnecter}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full text-left"
          style={{ color: 'var(--pp-nav-fg)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <LogOut size={16} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [nomUtilisateur, setNomUtilisateur] = useState<string | undefined>()

  useEffect(() => {
    getUser().then(u => { if (u) setNomUtilisateur(u.prenom ?? u.nom) })
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Sidebar desktop */}
      <div className="hidden md:block w-56 shrink-0">
        <EmployeSidebar activePath={pathname} nomUtilisateur={nomUtilisateur} />
      </div>

      {/* Contenu */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {itemsNav.map(item => {
            const actif = pathname === item.href || pathname.startsWith(item.href + '/')
            if (item.central) {
              return (
                <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 -mt-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center border-4"
                    style={{
                      backgroundColor: 'var(--pp-accent)',
                      borderColor: 'var(--pp-card-bg)',
                      boxShadow: 'var(--shadow-fab)',
                    }}
                  >
                    <item.icone size={22} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--pp-accent)' }}>
                    {item.label}
                  </span>
                </a>
              )
            }
            return (
              <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 px-3 py-1">
                <item.icone
                  size={20}
                  strokeWidth={2}
                  style={{ color: actif ? 'var(--pp-accent)' : 'var(--pp-text-muted)' }}
                />
                <span
                  className={cn('text-[10px]', actif ? 'font-semibold' : 'font-normal')}
                  style={{ color: actif ? 'var(--pp-accent)' : 'var(--pp-text-muted)' }}
                >
                  {item.label}
                </span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
