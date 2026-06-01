'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Clock, Calendar, QrCode, User } from 'lucide-react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import { getUser } from '@/lib/auth-client'
import { cn } from '@/lib/utils'

const itemsMobileNav = [
  { label: 'Dashboard', href: '/admin/dashboard', icone: LayoutDashboard },
  { label: 'Employés',  href: '/admin/employes',  icone: Users           },
  { label: 'Pointages', href: '/admin/pointages', icone: Clock           },
  { label: 'Congés',    href: '/admin/conges',    icone: Calendar        },
  { label: 'QR Code',   href: '/admin/qr-display', icone: QrCode        },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [nomUtilisateur, setNomUtilisateur] = useState<string | undefined>()

  useEffect(() => {
    getUser().then(u => { if (u) setNomUtilisateur(u.nom) })
  }, [])

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: 'var(--pp-page-bg)' }}
    >
      <div className="hidden md:block w-64 shrink-0">
        <AdminSidebar nomUtilisateur={nomUtilisateur} />
      </div>

      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {itemsMobileNav.map(item => {
            const actif = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-0"
              >
                <item.icone
                  size={20}
                  style={{ color: actif ? 'var(--pp-accent)' : 'var(--pp-text-secondary)' }}
                />
                <span
                  className={cn('text-[10px] truncate', actif ? 'font-semibold' : 'font-normal')}
                  style={{ color: actif ? 'var(--pp-accent)' : 'var(--pp-text-secondary)' }}
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
