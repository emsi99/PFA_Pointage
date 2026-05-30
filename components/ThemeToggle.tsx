'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme !== 'light'

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
        style={{
          backgroundColor: 'var(--pp-nav-hover-bg)',
          color: 'var(--pp-text-secondary)',
        }}
        aria-label="Changer le thème"
      >
        {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-colors text-left"
      style={{ color: 'var(--pp-nav-fg)' }}
      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
    >
      {isDark ? <Sun size={16} strokeWidth={2} /> : <Moon size={16} strokeWidth={2} />}
      {isDark ? 'Mode clair' : 'Mode sombre'}
    </button>
  )
}
