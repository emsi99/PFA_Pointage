'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Clock, QrCode, Calendar, User, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { getUser, logout } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const itemsNav = [
  { label: 'Accueil',    href: '/employe/pointage',   icone: Home,     central: false },
  { label: 'Historique', href: '/employe/historique',  icone: Clock,    central: false },
  { label: 'Pointer',    href: '/employe/scanner',     icone: QrCode,   central: true  },
  { label: 'Congés',     href: '/employe/conges',      icone: Calendar, central: false },
  { label: 'Profil',     href: '/employe/profil',      icone: User,     central: false },
]

function EmployeSidebar({ activePath, nomUtilisateur }: { activePath: string; nomUtilisateur?: string }) {
  const { theme, toggleTheme } = useTheme()

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  return (
    <aside
      className="w-56 flex flex-col fixed h-full z-10 transition-colors duration-300"
      style={{ backgroundColor: 'var(--pt-sidebar-bg)' }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--pt-accent)' }}
          >
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <span className="text-white font-bold text-base">PointApp</span>
        </div>
        {nomUtilisateur && (
          <p className="text-xs mt-2 truncate" style={{ color: 'var(--pt-sidebar-text)' }}>
            {nomUtilisateur}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {itemsNav.filter(i => !i.central).concat(itemsNav.filter(i => i.central)).map(item => {
          const actif = activePath === item.href || activePath.startsWith(item.href + '/')
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
              onMouseEnter={e => { if (!actif) { e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'; e.currentTarget.style.color = '#fff' } }}
              onMouseLeave={e => { if (!actif) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pt-sidebar-text)' } }}
            >
              <item.icone size={16} />
              {item.label}
            </a>
          )
        })}
      </nav>

      {/* Bas */}
      <div className="p-3 border-t space-y-0.5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'var(--pt-sidebar-text)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pt-sidebar-text)' }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>
        <button
          onClick={deconnecter}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors"
          style={{ color: 'var(--pt-sidebar-text)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pt-sidebar-active)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pt-sidebar-text)' }}
        >
          <LogOut size={16} />
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
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--pt-page-bg)' }}
    >
      {/* Sidebar desktop — hidden on mobile */}
      <div className="hidden md:block w-56 shrink-0">
        <EmployeSidebar activePath={pathname} nomUtilisateur={nomUtilisateur} />
      </div>

      {/* Contenu scrollable */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-3">
          {itemsNav.map(item => {
            const actif = pathname === item.href || pathname.startsWith(item.href + '/')

            if (item.central) {
              return (
                <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 -mt-5">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4"
                    style={{
                      backgroundColor: 'var(--pt-accent)',
                      borderColor: 'var(--pt-card-bg)',
                    }}
                  >
                    <item.icone size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--pt-accent)' }}>
                    {item.label}
                  </span>
                </a>
              )
            }

            return (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <item.icone
                  size={20}
                  style={{ color: actif ? 'var(--pt-accent)' : 'var(--pt-text-secondary)' }}
                />
                <span
                  className={cn('text-[10px]', actif ? 'font-semibold' : 'font-normal')}
                  style={{ color: actif ? 'var(--pt-accent)' : 'var(--pt-text-secondary)' }}
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
