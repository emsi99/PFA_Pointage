'use client'

import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, Clock, UserX, LogOut, Timer, FileSpreadsheet } from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import { exportAnomaliesExcel, type AnomalieExport } from '@/lib/export'

type TypeAnomalie = 'retard' | 'absence' | 'sortie_anticipee' | 'heures_insuffisantes'

interface Anomalie {
  user_id: string
  nom: string
  prenom: string
  matricule: string
  date: string
  type_anomalie: TypeAnomalie
  detail: string
}

type CfgType = { label: string; couleur: string; Icone: React.ElementType }

const CONFIG_TYPES: Record<TypeAnomalie, CfgType> = {
  retard:               { label: 'Retard',               couleur: '#f59e0b', Icone: Clock       },
  absence:              { label: 'Absence',              couleur: '#ef4444', Icone: UserX       },
  sortie_anticipee:     { label: 'Sortie anticipée',     couleur: '#8b5cf6', Icone: LogOut      },
  heures_insuffisantes: { label: 'Heures insuffisantes', couleur: '#06b6d4', Icone: Timer       },
}

const PERIODES = [
  { label: '7 j',  valeur: 7  },
  { label: '30 j', valeur: 30 },
  { label: '90 j', valeur: 90 },
]

const couleurAvatar = (texte: string) => {
  const palette = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#db2777']
  return palette[(texte.charCodeAt(0) || 0) % palette.length]
}

export default function PageAnomalies() {
  const [toutesAnomalies, setToutesAnomalies] = useState<Anomalie[]>([])
  const [chargement, setChargement]           = useState(true)
  const [typeFiltre, setTypeFiltre]           = useState<TypeAnomalie | ''>('')
  const [periode, setPeriode]                 = useState(30)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch(`/api/anomalies?depuis=${periode}`)
      const d   = await res.json()
      if (d.success) setToutesAnomalies(d.anomalies)
      else setToutesAnomalies([])
    } catch {
      setToutesAnomalies([])
    } finally {
      setChargement(false)
    }
  }, [periode])

  useEffect(() => {
    const t = window.setTimeout(() => charger(), 0)
    return () => window.clearTimeout(t)
  }, [charger])

  // Client-side filter by type
  const anomalies = typeFiltre
    ? toutesAnomalies.filter(a => a.type_anomalie === typeFiltre)
    : toutesAnomalies

  const stats = {
    retard:               toutesAnomalies.filter(a => a.type_anomalie === 'retard').length,
    absence:              toutesAnomalies.filter(a => a.type_anomalie === 'absence').length,
    sortie_anticipee:     toutesAnomalies.filter(a => a.type_anomalie === 'sortie_anticipee').length,
    heures_insuffisantes: toutesAnomalies.filter(a => a.type_anomalie === 'heures_insuffisantes').length,
  }

  const donneesExport = (): AnomalieExport[] =>
    anomalies.map(a => ({
      nom:           a.nom,
      prenom:        a.prenom,
      matricule:     a.matricule,
      date:          new Date(`${a.date}T00:00:00`).toLocaleDateString('fr-FR'),
      type_anomalie: CONFIG_TYPES[a.type_anomalie]?.label ?? a.type_anomalie,
      detail:        a.detail,
    }))

  const nomFichier = `anomalies-${new Date().toISOString().split('T')[0]}`

  const rightElement = (
    <button
      onClick={() => exportAnomaliesExcel(donneesExport(), nomFichier)}
      disabled={chargement || anomalies.length === 0}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)', backgroundColor: 'var(--pp-card-bg)' }}
    >
      <FileSpreadsheet size={14} strokeWidth={2} />
      Excel
    </button>
  )

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader
        title="Anomalies"
        subtitle={
          chargement
            ? 'Chargement...'
            : `${anomalies.length} anomalie${anomalies.length !== 1 ? 's' : ''} — ${periode} derniers jours`
        }
        rightElement={rightElement}
      />

      <div className="px-6 py-6 space-y-5">

        {/* Stat cards — clickable type filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(Object.entries(CONFIG_TYPES) as [TypeAnomalie, CfgType][]).map(([key, cfg]) => (
            <button
              type="button"
              key={key}
              onClick={() => setTypeFiltre(prev => prev === key ? '' : key)}
              className="rounded-2xl border p-4 flex items-center gap-3 cursor-pointer transition-all select-none w-full text-left"
              style={{
                backgroundColor: typeFiltre === key ? `${cfg.couleur}10` : 'var(--pp-card-bg)',
                borderColor:     typeFiltre === key ? cfg.couleur         : 'var(--pp-card-border)',
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cfg.couleur}18`, color: cfg.couleur }}
              >
                <cfg.Icone size={17} strokeWidth={2} />
              </div>
              {chargement ? (
                <div className="space-y-1.5">
                  <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              ) : (
                <div>
                  <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {stats[key]}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>{cfg.label}s</p>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Period + clear-filter bar */}
        <div
          className="rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <span className="text-xs font-semibold uppercase tracking-wide mr-1" style={{ color: 'var(--pp-text-muted)' }}>
            Période
          </span>
          {PERIODES.map(p => (
            <button
              key={p.valeur}
              onClick={() => setPeriode(p.valeur)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={periode === p.valeur
                ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
                : { backgroundColor: 'var(--pp-page-bg)', color: 'var(--pp-text-secondary)', border: '1px solid var(--pp-card-border)' }}
            >
              {p.label}
            </button>
          ))}

          {typeFiltre && (
            <>
              <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--pp-divider)' }} />
              <span className="text-xs font-medium px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: `${CONFIG_TYPES[typeFiltre].couleur}18`, color: CONFIG_TYPES[typeFiltre].couleur }}>
                {CONFIG_TYPES[typeFiltre].label}s uniquement
              </span>
              <button
                onClick={() => setTypeFiltre('')}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: 'var(--pp-text-muted)', border: '1px solid var(--pp-card-border)' }}
              >
                Tout afficher
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {chargement ? (
            <div className="p-6 space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--pp-divider)', backgroundColor: 'var(--pp-page-bg)' }}>
                    {['Employé', 'Date', 'Type', 'Détail'].map(col => (
                      <th
                        key={col}
                        className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--pp-text-muted)' }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a, i) => {
                    const cfg       = CONFIG_TYPES[a.type_anomalie]
                    const initiales = `${a.prenom[0] ?? ''}${a.nom[0] ?? ''}`.toUpperCase()
                    const date      = new Date(`${a.date}T00:00:00`).toLocaleDateString('fr-FR')

                    return (
                      <tr key={i} style={{ borderTop: '1px solid var(--pp-divider)' }}>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: couleurAvatar(a.nom) }}
                            >
                              {initiales}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                                {a.prenom} {a.nom}
                              </p>
                              {a.matricule && (
                                <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                                  {a.matricule}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td
                          className="px-5 py-3.5 text-sm tabular-nums whitespace-nowrap"
                          style={{ color: 'var(--pp-text-secondary)', fontFamily: 'var(--font-mono)' }}
                        >
                          {date}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                            style={{ backgroundColor: `${cfg.couleur}18`, color: cfg.couleur }}
                          >
                            <cfg.Icone size={11} strokeWidth={2.5} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
                          {a.detail}
                        </td>
                      </tr>
                    )
                  })}

                  {anomalies.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center">
                        <AlertTriangle
                          size={32}
                          strokeWidth={1.5}
                          className="mx-auto mb-3 opacity-20"
                          style={{ color: 'var(--pp-text-muted)' }}
                        />
                        <p className="text-sm font-medium" style={{ color: 'var(--pp-text-muted)' }}>
                          Aucune anomalie détectée
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--pp-text-muted)', opacity: 0.6 }}>
                          sur les {periode} derniers jours
                          {typeFiltre ? ` · filtre : ${CONFIG_TYPES[typeFiltre].label}s` : ''}
                        </p>
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
  )
}
