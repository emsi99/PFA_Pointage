'use client'

import { useState, useEffect } from 'react'
import {
  Users, UserCheck, Clock, UserX, Timer,
  TrendingUp, TrendingDown,
  ArrowRight, AlertTriangle
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { getUser, type Utilisateur } from '@/lib/auth-client'
import AdminHeader from '@/components/layout/AdminHeader'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatsDashboard {
  totalEmployes: number
  employesActifs: number
  admins: number
  tauxPresence: number
  activiteRecente: { type: string; description: string; heure: string }[]
}

// ─── Données graphiques (démo visuelle) ──────────────────────────────────────

const donneesDonut = (tauxPresence: number, total: number) => {
  const presents  = Math.round((tauxPresence / 100) * total)
  const absents   = Math.round((total - presents) * 0.54)
  const retards   = total - presents - absents
  return [
    { nom: 'Présents', valeur: presents,  couleur: '#16a34a' },
    { nom: 'Absents',  valeur: absents,   couleur: '#ef4444' },
    { nom: 'Retards',  valeur: retards,   couleur: '#f59e0b' },
  ]
}

const donneesAires = [
  { jour: '16 Avr', heures: 712 },
  { jour: '17 Avr', heures: 798 },
  { jour: '18 Avr', heures: 651 },
  { jour: '19 Avr', heures: 874 },
  { jour: '20 Avr', heures: 920 },
  { jour: '21 Avr', heures: 836 },
  { jour: '22 Avr', heures: 856 },
]

const anomalies = [
  { label: 'Retard',              val: 12, couleur: '#f59e0b' },
  { label: 'Absence',             val: 14, couleur: '#ef4444' },
  { label: 'Sortie anticipée',    val: 6,  couleur: '#8b5cf6' },
  { label: 'Heures insuffisantes',val: 9,  couleur: '#f97316' },
]

// ─── Composant carte stat ─────────────────────────────────────────────────────

function CarteStat({
  titre, valeur, sous, icone: Icone, couleur, delta, deltaPos, chargement,
}: {
  titre: string; valeur: string | number; sous: string
  icone: React.ElementType; couleur: string
  delta?: string; deltaPos?: boolean; chargement: boolean
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-3"
      style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${couleur}18`, color: couleur }}
        >
          <Icone size={19} strokeWidth={2} />
        </div>
        {delta && !chargement && (
          <div
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: deltaPos ? '#16a34a18' : '#ef444418',
              color: deltaPos ? '#16a34a' : '#ef4444',
            }}
          >
            {deltaPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {delta}
          </div>
        )}
      </div>
      {chargement ? (
        <div className="space-y-2">
          <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {valeur}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pp-text-secondary)' }}>{titre}</p>
          <p className="text-[11px] mt-1" style={{ color: 'var(--pp-text-muted)' }}>{sous}</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function PageDashboard() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [stats, setStats] = useState<StatsDashboard | null>(null)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    const charger = async () => {
      setChargement(true)
      try {
        const [user, resStats] = await Promise.all([
          getUser(),
          fetch('/api/stats'),
        ])
        setUtilisateur(user)
        const d = await resStats.json()
        if (d.success) setStats(d.data)
      } catch { /* ignore */ }
      finally { setChargement(false) }
    }
    charger()
  }, [])

  const taux = stats?.tauxPresence ?? 79
  const total = stats?.totalEmployes ?? 124
  const presents = Math.round((taux / 100) * total)
  const retards = Math.round(total * 0.097)
  const absents = total - presents - retards
  const donut = donneesDonut(taux, total)

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader 
        title="Tableau de bord"
        subtitle={chargement ? 'Chargement...' : `Bonjour, ${utilisateur?.nom ?? 'Admin'} 👋`}
      />

      <div className="px-6 py-6 space-y-6">
        {/* 5 cartes stat */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <CarteStat titre="Total employés"  valeur={chargement ? '—' : total}             sous="Effectif global"    icone={Users}    couleur="#2563eb"           chargement={chargement} />
          <CarteStat titre="Présents"        valeur={chargement ? '—' : presents}          sous="Aujourd'hui"        icone={UserCheck} couleur="#16a34a" delta="+79%" deltaPos={true}  chargement={chargement} />
          <CarteStat titre="Retards"         valeur={chargement ? '—' : retards}           sous="Ce matin"           icone={Clock}    couleur="#f59e0b" delta="↘ 10%" deltaPos={false} chargement={chargement} />
          <CarteStat titre="Absences"        valeur={chargement ? '—' : absents}           sous="Non justifiées"     icone={UserX}    couleur="#ef4444" delta="↘ 11%" deltaPos={false} chargement={chargement} />
          <CarteStat titre="Heures totales"  valeur={chargement ? '—' : '856h 30m'}        sous="Cette semaine"      icone={Timer}    couleur="#8b5cf6"           chargement={chargement} />
        </div>

        {/* Ligne centrale : Donut + Graphe aires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Donut */}
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Taux de présence
              </h2>
              <a href="/admin/pointages" className="text-xs flex items-center gap-1" style={{ color: 'var(--pp-accent)' }}>
                Détails <ArrowRight size={11} />
              </a>
            </div>
            <div className="relative flex items-center justify-center" style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donut}
                    cx="50%" cy="50%"
                    innerRadius={58} outerRadius={78}
                    dataKey="valeur"
                    strokeWidth={0}
                  >
                    {donut.map((d, i) => <Cell key={i} fill={d.couleur} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, n) => [v as number, n as string]}
                    contentStyle={{
                      backgroundColor: 'var(--pp-card-bg)',
                      border: '1px solid var(--pp-card-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[30px] font-bold leading-none" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {taux}%
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--pp-text-muted)' }}>Présence</p>
              </div>
            </div>
            {/* Légende */}
            <div className="flex flex-col gap-1.5 mt-3">
              {donut.map(d => (
                <div key={d.nom} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.couleur }} />
                    <span style={{ color: 'var(--pp-text-secondary)' }}>{d.nom}</span>
                  </div>
                  <span className="font-medium tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {d.valeur}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Graphe aires */}
          <div
            className="lg:col-span-2 rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                  Heures travaillées
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--pp-text-muted)' }}>7 derniers jours</p>
              </div>
              <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                856h
              </p>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={donneesAires} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillAccent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--pp-divider)" vertical={false} />
                <XAxis dataKey="jour" tick={{ fontSize: 10, fill: 'var(--pp-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 1000]} tick={{ fontSize: 10, fill: 'var(--pp-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [`${v}h`, 'Heures']}
                  contentStyle={{
                    backgroundColor: 'var(--pp-card-bg)',
                    border: '1px solid var(--pp-card-border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="heures"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#fillAccent)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ligne inférieure : Anomalies + Pointages récents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Anomalies */}
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={15} strokeWidth={2} color="#f59e0b" />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Anomalies détectées
              </h2>
            </div>
            <div className="space-y-3">
              {anomalies.map(a => (
                <div key={a.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: a.couleur }} />
                    <span className="text-sm" style={{ color: 'var(--pp-text-secondary)' }}>{a.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max(24, (a.val / 20) * 80)}px`,
                        backgroundColor: `${a.couleur}40`,
                      }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: '100%', backgroundColor: a.couleur }}
                      />
                    </div>
                    <span
                      className="text-sm font-semibold tabular-nums w-5 text-right"
                      style={{ color: a.couleur, fontFamily: 'var(--font-mono)' }}
                    >
                      {a.val}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pointages récents */}
          <div
            className="lg:col-span-2 rounded-2xl border overflow-hidden"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
          >
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--pp-divider)' }}>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Pointages récents
              </h2>
              <a href="/admin/pointages" className="text-xs flex items-center gap-1" style={{ color: 'var(--pp-accent)' }}>
                Voir tout <ArrowRight size={11} />
              </a>
            </div>

            {chargement ? (
              <div className="p-5 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                      <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--pp-divider)` }}>
                      {['Employé', 'Type', 'Heure', 'Localisation', 'Statut'].map(col => (
                        <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: 'var(--pp-text-muted)', backgroundColor: 'var(--pp-page-bg)' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.activiteRecente ?? []).slice(0, 5).map((a, i) => {
                      const couleurs = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
                      const c = couleurs[i % couleurs.length]
                      const initiale = a.description.split(' ')[0]?.[0]?.toUpperCase() ?? 'E'
                      const isEntree = a.type === 'pointage'
                      return (
                        <tr key={i} style={{ borderTop: `1px solid var(--pp-divider)` }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: c }}>
                                {initiale}
                              </div>
                              <span className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                                {a.description.split(' ').slice(0, 2).join(' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{ backgroundColor: isEntree ? '#16a34a18' : '#f59e0b18', color: isEntree ? '#16a34a' : '#f59e0b' }}>
                              {isEntree ? 'Entrée' : 'Sortie'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-sm tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                              {a.heure}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
                            Casablanca, Maroc
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium px-2 py-1 rounded-full"
                              style={{ backgroundColor: '#16a34a18', color: '#16a34a' }}>
                              Valide
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {(!stats?.activiteRecente?.length) && (
                      <tr>
                        <td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                          Aucun pointage aujourd&apos;hui
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
