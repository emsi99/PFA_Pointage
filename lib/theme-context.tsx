'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark-navy'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  toggleTheme: () => {},
})

export function ThemeProvider({
  children,
  initialTheme = 'light',
}: {
  children: React.ReactNode
  initialTheme?: Theme
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    // Synchroniser l'attribut data-theme sur <html>
    document.documentElement.setAttribute('data-theme', theme)
    // Persister dans un cookie lisible côté serveur (non httpOnly)
    document.cookie = `theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`
  }, [theme])

  const toggleTheme = () => {
    setTheme(t => (t === 'light' ? 'dark-navy' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
