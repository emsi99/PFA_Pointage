'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserCheck, Shield, TrendingUp, Activity,
  Clock, Calendar, AlertTriangle, FileText, QrCode,
} from 'lucide-react'
import { getUser, type Utilisateur } from '@/lib/auth-client'

interface StatsDashboard {
  totalEmployes: number
  employesActifs: number
  admins: number
  tauxPresence: number
  activiteRecente: { type: string; description: string; heure: string }[]
}

const ICONES_ACTIVITE: Record<string, React.ElementType> = {
  pointage: Clock,
  employe_cree: Users,
  default: Activity,
}

const COULEURS_ACTIVITE: Record<string, string> = {
  pointage: '#2e75b6',
  employe_cree: '#10b981',
  default: '#8b5cf6',
}

const CarteIndicateur = ({
  titre, valeur, sous_titre, icone: Icone, couleur, chargement,
}: {
  titre: string
  valeur: number | string
  sous_titre: string
  icone: React.ElementType
  couleur: string
  chargement: boolean
}) => (
  <div
    className="rounded-xl border p-6 flex items-center gap-4 transition-colors duration-300"
    style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${couleur}18`, color: couleur }}
    >
      <Icone size={22} />
    </div>
    <div>
      {chargement ? (
        <>
          <div className="h-7 w-12 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold" style={{ color: 'var(--pt-text-primary)' }}>{valeur}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pt-text-secondary)' }}>{titre}</p>
        </>
      )}
    </div>
    {!chargement && (
      <span
        className="ml-auto text-xs font-medium px-2 py-1 rounded-full"
        style={{ backgroundColor: `${couleur}18`, color: couleur }}
      >
        {sous_titre}
      </span>
    )}
  </div>
)

const raccourcis = [
  { label: 'Gérer les employés', href: '/admin/employes',  icone: Users,          couleur: '#2e75b6' },
  { label: 'Voir les pointages',  href: '/admin/pointages', icone: Clock,          couleur: '#10b981' },
  { label: 'Congés en attente',   href: '/admin/conges',    icone: Calendar,       couleur: '#8b5cf6' },
  { label: 'Anomalies détectées', href: '/admin/anomalies', icone: AlertTriangle,  couleur: '#f59e0b' },
  { label: 'Générer QR Code',     href: '/admin/qrcode',    icone: QrCode,         couleur: '#6366f1' },
  { label: 'Rapports',            href: '/admin/rapports',  icone: FileText,       couleur: '#64748b' },
]

export default function PageDashboard() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [stats, setStats] = useState<StatsDashboard | null>(null)
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const chargerDonnees = useCallback(async () => {
    setChargement(true)
    try {
      const [user, resStats] = await Promise.all([
        getUser(),
        fetch('/api/stats'),
      ])
      setUtilisateur(user)
      const dataStats = await resStats.json()
      if (dataStats.success) {
        setStats(dataStats.data)
      } else {
        setErreur('Impossible de charger les statistiques')
      }
    } catch {
      setErreur('Erreur réseau')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    chargerDonnees()
  }, [chargerDonnees])

  return (
    <div className="px-4 md:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <p className="text-sm capitalize mb-1" style={{ color: 'var(--pt-text-secondary)' }}>
            {dateAujourdhui}
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pt-text-primary)' }}>
            {chargement ? 'Chargement...' : `Bonjour, ${utilisateur?.nom ?? 'Admin'} 👋`}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--pt-text-secondary)' }}>
            Voici un aperçu de votre système de pointage
          </p>
        </div>

        {erreur && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
            {erreur}
          </div>
        )}

        {/* Cartes indicateurs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <CarteIndicateur
            titre="Total employés"   valeur={stats?.totalEmployes  ?? 0}
            sous_titre="Tous"        icone={Users}       couleur="#2e75b6" chargement={chargement} />
          <CarteIndicateur
            titre="Employés actifs"  valeur={stats?.employesActifs ?? 0}
            sous_titre="Actifs"      icone={UserCheck}   couleur="#10b981" chargement={chargement} />
          <CarteIndicateur
            titre="Administrateurs"  valeur={stats?.admins         ?? 0}
            sous_titre="Admins"      icone={Shield}      couleur="#8b5cf6" chargement={chargement} />
          <CarteIndicateur
            titre="Taux de présence" valeur={stats ? `${stats.tauxPresence}%` : '0%'}
            sous_titre="Aujourd'hui" icone={TrendingUp}  couleur="#f59e0b" chargement={chargement} />
        </div>

        {/* Section principale */}
        <div className="grid grid-cols-3 gap-6">
          {/* Activité récente */}
          <div
            className="col-span-2 rounded-xl border p-6 transition-colors duration-300"
            style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold" style={{ color: 'var(--pt-text-primary)' }}>
                Activité récente
              </h2>
              <Activity size={16} style={{ color: 'var(--pt-text-secondary)' }} />
            </div>

            {chargement ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.activiteRecente?.length ? (
              <div className="divide-y" style={{ borderColor: 'var(--pt-card-border)' }}>
                {stats.activiteRecente.map((a, i) => {
                  const Icone = ICONES_ACTIVITE[a.type] ?? ICONES_ACTIVITE.default
                  const couleur = COULEURS_ACTIVITE[a.type] ?? COULEURS_ACTIVITE.default
                  return (
                    <div key={i} className="flex items-center gap-3 py-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${couleur}20`, color: couleur }}
                      >
                        <Icone size={14} />
                      </div>
                      <p className="text-sm flex-1" style={{ color: 'var(--pt-text-primary)' }}>
                        {a.description}
                      </p>
                      <span className="text-xs shrink-0" style={{ color: 'var(--pt-text-secondary)' }}>
                        {a.heure}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-center py-8" style={{ color: 'var(--pt-text-secondary)' }}>
                Aucune activité aujourd&apos;hui
              </p>
            )}
          </div>

          {/* Accès rapides */}
          <div
            className="rounded-xl border p-6 transition-colors duration-300"
            style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
          >
            <h2 className="font-semibold mb-4" style={{ color: 'var(--pt-text-primary)' }}>
              Accès rapides
            </h2>
            <div className="space-y-1">
              {raccourcis.map(r => (
                <a
                  key={r.href}
                  href={r.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group"
                  style={{ color: 'var(--pt-text-primary)' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pt-muted)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${r.couleur}18`, color: r.couleur }}
                  >
                    <r.icone size={15} />
                  </div>
                  <span className="text-sm font-medium">{r.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
    </div>
  )
}
