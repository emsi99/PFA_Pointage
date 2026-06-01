'use client'

import { LogOut } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { logout } from '@/lib/auth-client'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  rightElement?: React.ReactNode
}

export default function AdminHeader({ title, subtitle, rightElement }: AdminHeaderProps) {
  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  return (
    <header
      className="sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between gap-4"
      style={{ backgroundColor: 'var(--pp-page-bg)', borderColor: 'var(--pp-card-border)' }}
    >
      <div>
        <h1 className="text-base font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {rightElement}
        
        <div className="flex items-center gap-2 pl-3 border-l" style={{ borderColor: 'var(--pp-card-border)' }}>
          <ThemeToggle />
          <button 
            onClick={deconnecter}
            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  )
}
