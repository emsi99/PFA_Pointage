'use client'

import { Moon, Sun, LogOut } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { logout } from '@/lib/auth-client'

interface EmployeHeaderProps {
  nomUtilisateur?: string
  initiale?: string
  chargement?: boolean
}

export default function EmployeHeader({ nomUtilisateur, initiale, chargement }: EmployeHeaderProps) {
  const { theme, toggleTheme } = useTheme()

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  return (
    <header
      className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between md:hidden border-b"
      style={{ 
        backgroundColor: 'var(--pp-sidebar-bg)', 
        borderColor: 'var(--pp-sidebar-border)' 
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
          style={{ backgroundColor: 'var(--pp-accent)' }}
        >
          {initiale || 'E'}
        </div>
        <div className="min-w-0">
          {chargement ? (
            <div className="h-3 w-20 bg-gray-200 animate-pulse rounded" />
          ) : (
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--pp-text-primary)' }}>
              {nomUtilisateur || 'Employé'}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--pp-nav-hover-bg)', color: 'var(--pp-text-secondary)' }}
          title={theme === 'light' ? 'Mode sombre' : 'Mode clair'}
        >
          {theme === 'light' ? <Moon size={18} strokeWidth={2} /> : <Sun size={18} strokeWidth={2} />}
        </button>
        
        <button
          onClick={deconnecter}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ backgroundColor: 'var(--pp-nav-hover-bg)', color: '#ef4444' }}
          title="Déconnexion"
        >
          <LogOut size={18} strokeWidth={2} />
        </button>
      </div>
    </header>
  )
}
