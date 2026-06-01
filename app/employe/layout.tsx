'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Clock, QrCode, Calendar, User, Sun, Moon, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { getUser, logout } from '@/lib/auth-client'
import Logo from '@/components/Logo'
import { cn } from '@/lib/utils'
import EmployeHeader from '@/components/layout/EmployeHeader'

const itemsNav = [
  { label: 'Accueil',    href: '/employe/pointage',  icone: Home,     central: false },
  { label: 'Historique', href: '/employe/historique', icone: Clock,    central: false },
  { label: 'Pointer',    href: '/employe/scanner',    icone: QrCode,   central: true  },
  { label: 'Congés',     href: '/employe/conges',     icone: Calendar, central: false },
  { label: 'Profil',     href: '/employe/profil',     icone: User,     central: false },
]

function EmployeSidebar({ activePath, nomUtilisateur, initiale }: { activePath: string; nomUtilisateur?: string; initiale?: string }) {
  const { theme, toggleTheme } = useTheme()

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  return (
    <aside
      className="w-60 flex flex-col fixed h-full z-10 border-r"
      style={{ backgroundColor: 'var(--pp-sidebar-bg)', borderColor: 'var(--pp-sidebar-border)' }}
    >
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--pp-sidebar-border)' }}>
        <Logo />
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {itemsNav.map(item => {
          const actif = activePath === item.href || activePath.startsWith(item.href + '/')
          return (
            <a
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all"
              style={{
                backgroundColor: actif ? 'var(--pp-nav-active-bg)' : 'transparent',
                color: actif ? 'var(--pp-nav-active-fg)' : 'var(--pp-nav-fg)',
                fontWeight: actif ? 600 : 400,
              }}
              onMouseEnter={e => { if (!actif) e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
              onMouseLeave={e => { if (!actif) e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <item.icone size={18} strokeWidth={actif ? 2.5 : 2} />
              {item.label}
            </a>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t space-y-1" style={{ borderColor: 'var(--pp-sidebar-border)' }}>
        {/* User Info */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: 'var(--pp-accent)' }}
          >
            {initiale}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--pp-text-primary)' }}>
              {nomUtilisateur || 'Employé'}
            </p>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--pp-text-muted)' }}>
              Session
            </p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-colors"
          style={{ color: 'var(--pp-nav-fg)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
          {theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        </button>
        <button
          onClick={deconnecter}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm w-full text-left transition-colors text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut size={18} strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

export default function EmployeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    getUser().then(u => { 
      if (u) setUser(u)
      setChargement(false)
    })
  }, [])

  const nomUtilisateur = user ? (user.prenom || user.nom) : undefined
  const initiale = user ? (user.prenom?.[0] || user.nom?.[0] || 'E').toUpperCase() : 'E'

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Sidebar desktop */}
      <div className="hidden md:block w-60 shrink-0">
        <EmployeSidebar activePath={pathname} nomUtilisateur={nomUtilisateur} initiale={initiale} />
      </div>

      {/* Contenu */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <EmployeHeader nomUtilisateur={nomUtilisateur} initiale={initiale} chargement={chargement} />
        
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)', boxShadow: '0 -4px 20px rgba(0,0,0,0.03)' }}
      >
        <div className="flex items-end justify-around px-2 pt-2 pb-5">
          {itemsNav.map(item => {
            const actif = pathname === item.href || pathname.startsWith(item.href + '/')
            if (item.central) {
              return (
                <a key={item.href} href={item.href} className="flex flex-col items-center gap-1 -mt-8 transition-transform active:scale-90">
                  <div
                    className="w-16 h-16 rounded-3xl flex items-center justify-center border-[6px]"
                    style={{
                      backgroundColor: 'var(--pp-accent)',
                      borderColor: 'var(--pp-page-bg)',
                      boxShadow: '0 8px 25px -5px var(--pp-accent)',
                    }}
                  >
                    <item.icone size={28} className="text-white" strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter" style={{ color: 'var(--pp-accent)' }}>
                    {item.label}
                  </span>
                </a>
              )
            }
            return (
              <a key={item.href} href={item.href} className="flex flex-col items-center gap-1.5 px-3 py-1 transition-all active:scale-90">
                <item.icone
                  size={22}
                  strokeWidth={actif ? 2.5 : 2}
                  style={{ color: actif ? 'var(--pp-accent)' : 'var(--pp-text-muted)' }}
                />
                <span
                  className={cn('text-[10px] font-bold uppercase tracking-tighter', actif ? '' : 'opacity-70')}
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
