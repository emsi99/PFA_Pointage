'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserCheck, UserX, Clock, Calendar, AlertTriangle,
  FileSpreadsheet, FileText, CheckCircle, XCircle, AlertCircle,
} from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'
import {
  exportPresenceExcel,
  exportPresencePDF,
  exportCongesExcel,
  exportAnomaliesResumeExcel,
  type PresenceRapport,
  type CongeRapport,
  type AnomalieRapport,
} from '@/lib/export'

// ── Types ────────────────────────────────────────────────────────────────────

type Onglet = 'presence' | 'conges' | 'anomalies'

interface Employe {
  _id: string
  nom: string
  prenom: string
  email: string
}

interface PointageBrut {
  user_id: Employe | string
  date: string
  heure: string
  type: 'entree' | 'sortie'
}

interface CongeRaw {
  _id: string
  user_id: { _id: string; nom: string; prenom: string; matricule?: string } | null
  type: 'annuel' | 'maladie' | 'exceptionnel'
  date_debut: string
  date_fin: string
  statut: 'en_attente' | 'valide' | 'refuse'
}

interface AnomalieRaw {
  user_id: string
  nom: string
  prenom: string
  matricule: string
  type_anomalie: 'retard' | 'absence' | 'sortie_anticipee' | 'heures_insuffisantes'
}

interface LignePresence {
  userId: string
  nom: string
  prenom: string
  joursPresents: number
  joursAbsents: number
  retards: number
  tauxPresence: number
}

interface LigneAnomalieResume {
  cle: string
  nom: string
  prenom: string
  matricule: string
  retards: number
  absences: number
  sortiesAnticipees: number
  heuresInsuffisantes: number
  total: number
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PERIODES = [
  { label: '7 j',  valeur: 7  },
  { label: '30 j', valeur: 30 },
  { label: '90 j', valeur: 90 },
]

const LABELS_TYPE_CONGE: Record<string, string> = {
  annuel:       'Congé annuel',
  maladie:      'Congé maladie',
  exceptionnel: 'Congé exceptionnel',
}

const LABELS_STATUT: Record<string, string> = {
  en_attente: 'En attente',
  valide:     'Validé',
  refuse:     'Refusé',
}

const COULEURS_STATUT: Record<string, string> = {
  en_attente: '#f59e0b',
  valide:     '#16a34a',
  refuse:     '#ef4444',
}

function heureEnMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

function joursOuvrables(dateDebut: string, dateFin: string): number {
  const debut = new Date(`${dateDebut}T00:00:00`)
  const fin   = new Date(`${dateFin}T00:00:00`)
  let count = 0
  const d = new Date(debut)
  while (d <= fin) {
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) count++
    d.setDate(d.getDate() + 1)
  }
  return count
}

function periodeDates(jours: number): { dateDebut: string; dateFin: string } {
  const fin   = new Date()
  const debut = new Date()
  debut.setDate(debut.getDate() - jours + 1)
  return {
    dateDebut: debut.toISOString().split('T')[0],
    dateFin:   fin.toISOString().split('T')[0],
  }
}

function couleurAvatar(texte: string): string {
  const palette = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#db2777']
  return palette[(texte.charCodeAt(0) || 0) % palette.length]
}

function dureeConge(dateDebut: string, dateFin: string): number {
  return (
    Math.round(
      (new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  )
}

// ── Composants utilitaires ───────────────────────────────────────────────────

function Squelette() {
  return (
    <div className="p-6 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full animate-pulse shrink-0" style={{ backgroundColor: 'var(--pp-divider)' }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded animate-pulse w-1/3" style={{ backgroundColor: 'var(--pp-divider)' }} />
            <div className="h-3 rounded animate-pulse w-1/2" style={{ backgroundColor: 'var(--pp-divider)', opacity: 0.5 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BoutonExport({
  onClick,
  disabled,
  icone: Icone,
  label,
}: {
  onClick: () => void
  disabled: boolean
  icone: React.ElementType
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        borderColor:     'var(--pp-card-border)',
        color:           'var(--pp-text-secondary)',
        backgroundColor: 'var(--pp-card-bg)',
      }}
    >
      <Icone size={14} strokeWidth={2} />
      {label}
    </button>
  )
}

function CompteurAnomalie({ valeur, couleur }: { valeur: number; couleur: string }) {
  if (valeur === 0) return <span className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>—</span>
  return (
    <span
      className="inline-block text-xs font-bold tabular-nums px-2 py-0.5 rounded-md"
      style={{ backgroundColor: `${couleur}18`, color: couleur, fontFamily: 'var(--font-mono)' }}
    >
      {valeur}
    </span>
  )
}

function SelecteurPeriode({
  periode,
  onChange,
}: {
  periode: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text-muted)' }}>
        Période
      </span>
      {PERIODES.map(p => (
        <button
          key={p.valeur}
          onClick={() => onChange(p.valeur)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={
            periode === p.valeur
              ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
              : { backgroundColor: 'var(--pp-page-bg)', color: 'var(--pp-text-secondary)', border: '1px solid var(--pp-card-border)' }
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}

// ── Onglet Présence ──────────────────────────────────────────────────────────

function OngletPresence() {
  const [periode, setPeriode]       = useState(30)
  const [lignes, setLignes]         = useState<LignePresence[]>([])
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const { dateDebut, dateFin } = periodeDates(periode)
      const params = new URLSearchParams({ limite: '1000', dateDebut, dateFin })

      const [resP, resE] = await Promise.all([
        fetch(`/api/pointages?${params}`),
        fetch('/api/employes'),
      ])
      const [dataP, dataE] = await Promise.all([resP.json(), resE.json()])

      if (!dataP.success || !dataE.success) { setLignes([]); return }

      const pointages: PointageBrut[] = dataP.data
      const employes: Employe[]       = dataE.data

      const totalJoursOuv = joursOuvrables(dateDebut, dateFin)

      // dates avec au moins un pointage par employé
      const datesParUser          = new Map<string, Set<string>>()
      // première entrée par jour par employé
      const premiereEntreeParUser = new Map<string, Map<string, string>>()

      for (const p of pointages) {
        const userId =
          typeof p.user_id === 'object'
            ? (p.user_id as Employe)._id
            : (p.user_id as string)

        if (!datesParUser.has(userId)) datesParUser.set(userId, new Set())
        datesParUser.get(userId)!.add(p.date)

        if (p.type === 'entree') {
          if (!premiereEntreeParUser.has(userId)) premiereEntreeParUser.set(userId, new Map())
          const map = premiereEntreeParUser.get(userId)!
          const ex  = map.get(p.date)
          if (!ex || p.heure < ex) map.set(p.date, p.heure)
        }
      }

      const result: LignePresence[] = employes.map(emp => {
        const dates         = datesParUser.get(emp._id) ?? new Set<string>()
        const joursPresents = dates.size
        const joursAbsents  = Math.max(0, totalJoursOuv - joursPresents)

        const entrees = premiereEntreeParUser.get(emp._id) ?? new Map<string, string>()
        let retards = 0
        for (const heure of entrees.values()) {
          if (heureEnMinutes(heure) > 8 * 60 + 15) retards++
        }

        const tauxPresence =
          totalJoursOuv > 0 ? Math.round((joursPresents / totalJoursOuv) * 100) : 0

        return { userId: emp._id, nom: emp.nom, prenom: emp.prenom, joursPresents, joursAbsents, retards, tauxPresence }
      }).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

      setLignes(result)
    } catch {
      setLignes([])
    } finally {
      setChargement(false)
    }
  }, [periode])

  useEffect(() => {
    const t = window.setTimeout(() => charger(), 0)
    return () => window.clearTimeout(t)
  }, [charger])

  const nomFichier   = `rapport-presence-${new Date().toISOString().split('T')[0]}`
  const exportReady  = !chargement && lignes.length > 0

  const donneesExport = (): PresenceRapport[] =>
    lignes.map(l => ({
      nom:           l.nom,
      prenom:        l.prenom,
      joursPresents: l.joursPresents,
      joursAbsents:  l.joursAbsents,
      retards:       l.retards,
      tauxPresence:  `${l.tauxPresence}%`,
    }))

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <SelecteurPeriode periode={periode} onChange={setPeriode} />
        <div className="flex items-center gap-2">
          <BoutonExport
            onClick={() => exportPresenceExcel(donneesExport(), nomFichier)}
            disabled={!exportReady}
            icone={FileSpreadsheet}
            label="Excel"
          />
          <BoutonExport
            onClick={() => exportPresencePDF(donneesExport(), nomFichier)}
            disabled={!exportReady}
            icone={FileText}
            label="PDF"
          />
        </div>
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        {chargement ? (
          <Squelette />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pp-divider)', backgroundColor: 'var(--pp-page-bg)' }}>
                  {['Employé', 'Jours présents', 'Jours absents', 'Retards', 'Taux présence'].map(col => (
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
                {lignes.map(l => {
                  const initiales   = `${l.prenom[0] ?? ''}${l.nom[0] ?? ''}`.toUpperCase()
                  const couleurTaux =
                    l.tauxPresence >= 80 ? '#16a34a' : l.tauxPresence >= 60 ? '#f59e0b' : '#ef4444'

                  return (
                    <tr key={l.userId} style={{ borderTop: '1px solid var(--pp-divider)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: couleurAvatar(l.nom) }}
                          >
                            {initiales}
                          </div>
                          <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                            {l.prenom} {l.nom}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#16a34a18', color: '#16a34a' }}
                        >
                          <UserCheck size={11} strokeWidth={2.5} />
                          {l.joursPresents} j
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#ef444418', color: '#ef4444' }}
                        >
                          <UserX size={11} strokeWidth={2.5} />
                          {l.joursAbsents} j
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {l.retards > 0 ? (
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: '#f59e0b18', color: '#f59e0b' }}
                          >
                            <Clock size={11} strokeWidth={2.5} />
                            {l.retards}
                          </span>
                        ) : (
                          <span className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-24 h-1.5 rounded-full overflow-hidden"
                            style={{ backgroundColor: 'var(--pp-divider)' }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${l.tauxPresence}%`, backgroundColor: couleurTaux }}
                            />
                          </div>
                          <span
                            className="text-xs font-semibold tabular-nums"
                            style={{ color: couleurTaux, fontFamily: 'var(--font-mono)' }}
                          >
                            {l.tauxPresence}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                      Aucune donnée de présence sur cette période
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onglet Congés ────────────────────────────────────────────────────────────

function OngletConges() {
  const [conges, setConges]         = useState<CongeRaw[]>([])
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res  = await fetch('/api/conges/admin')
      const data = await res.json()
      if (data.success) setConges(data.data)
      else setConges([])
    } catch {
      setConges([])
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => charger(), 0)
    return () => window.clearTimeout(t)
  }, [charger])

  const nomFichier  = `rapport-conges-${new Date().toISOString().split('T')[0]}`
  const exportReady = !chargement && conges.length > 0

  const donneesExport = (): CongeRapport[] =>
    conges.map(c => ({
      nom:       c.user_id?.nom       ?? 'Inconnu',
      prenom:    c.user_id?.prenom    ?? '',
      matricule: c.user_id?.matricule ?? '',
      type:      LABELS_TYPE_CONGE[c.type] ?? c.type,
      dateDebut: new Date(c.date_debut).toLocaleDateString('fr-FR'),
      dateFin:   new Date(c.date_fin).toLocaleDateString('fr-FR'),
      duree:     dureeConge(c.date_debut, c.date_fin),
      statut:    LABELS_STATUT[c.statut] ?? c.statut,
    }))

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border px-4 py-3 flex items-center justify-between"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <span className="text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
          {chargement
            ? 'Chargement...'
            : `${conges.length} demande${conges.length !== 1 ? 's' : ''} de congé`}
        </span>
        <BoutonExport
          onClick={() => exportCongesExcel(donneesExport(), nomFichier)}
          disabled={!exportReady}
          icone={FileSpreadsheet}
          label="Excel"
        />
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        {chargement ? (
          <Squelette />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pp-divider)', backgroundColor: 'var(--pp-page-bg)' }}>
                  {['Employé', 'Type congé', 'Date début', 'Date fin', 'Durée', 'Statut'].map(col => (
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
                {conges.map(c => {
                  const nom          = c.user_id ? `${c.user_id.prenom} ${c.user_id.nom}` : 'Inconnu'
                  const initiales    = c.user_id
                    ? `${c.user_id.prenom[0] ?? ''}${c.user_id.nom[0] ?? ''}`.toUpperCase()
                    : '?'
                  const duree        = dureeConge(c.date_debut, c.date_fin)
                  const couleurStatut = COULEURS_STATUT[c.statut] ?? '#6b7280'
                  const IconeStatut  =
                    c.statut === 'valide' ? CheckCircle
                    : c.statut === 'refuse' ? XCircle
                    : AlertCircle

                  return (
                    <tr key={c._id} style={{ borderTop: '1px solid var(--pp-divider)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: couleurAvatar(c.user_id?.nom ?? 'A') }}
                          >
                            {initiales}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                              {nom}
                            </p>
                            {c.user_id?.matricule && (
                              <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                                {c.user_id.matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: '#6366f118', color: '#6366f1' }}
                        >
                          {LABELS_TYPE_CONGE[c.type] ?? c.type}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm tabular-nums whitespace-nowrap"
                        style={{ color: 'var(--pp-text-secondary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm tabular-nums whitespace-nowrap"
                        style={{ color: 'var(--pp-text-secondary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {new Date(c.date_fin).toLocaleDateString('fr-FR')}
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm tabular-nums"
                        style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
                      >
                        {duree} j
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: `${couleurStatut}18`, color: couleurStatut }}
                        >
                          <IconeStatut size={11} strokeWidth={2.5} />
                          {LABELS_STATUT[c.statut] ?? c.statut}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {conges.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                      Aucune demande de congé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Onglet Anomalies résumé ──────────────────────────────────────────────────

function OngletAnomalies() {
  const [periode, setPeriode]       = useState(30)
  const [lignes, setLignes]         = useState<LigneAnomalieResume[]>([])
  const [chargement, setChargement] = useState(true)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res  = await fetch(`/api/anomalies?depuis=${periode}`)
      const data = await res.json()

      if (!data.success) { setLignes([]); return }

      const anomalies: AnomalieRaw[] = data.anomalies
      const map = new Map<string, LigneAnomalieResume>()

      for (const a of anomalies) {
        const cle = `${a.nom}_${a.prenom}_${a.matricule}`
        if (!map.has(cle)) {
          map.set(cle, {
            cle,
            nom:                 a.nom,
            prenom:              a.prenom,
            matricule:           a.matricule,
            retards:             0,
            absences:            0,
            sortiesAnticipees:   0,
            heuresInsuffisantes: 0,
            total:               0,
          })
        }
        const ligne = map.get(cle)!
        if (a.type_anomalie === 'retard')               ligne.retards++
        if (a.type_anomalie === 'absence')              ligne.absences++
        if (a.type_anomalie === 'sortie_anticipee')     ligne.sortiesAnticipees++
        if (a.type_anomalie === 'heures_insuffisantes') ligne.heuresInsuffisantes++
        ligne.total++
      }

      setLignes([...map.values()].sort((a, b) => b.total - a.total))
    } catch {
      setLignes([])
    } finally {
      setChargement(false)
    }
  }, [periode])

  useEffect(() => {
    const t = window.setTimeout(() => charger(), 0)
    return () => window.clearTimeout(t)
  }, [charger])

  const nomFichier  = `rapport-anomalies-${new Date().toISOString().split('T')[0]}`
  const exportReady = !chargement && lignes.length > 0

  const donneesExport = (): AnomalieRapport[] =>
    lignes.map(l => ({
      nom:                 l.nom,
      prenom:              l.prenom,
      matricule:           l.matricule,
      retards:             l.retards,
      absences:            l.absences,
      sortiesAnticipees:   l.sortiesAnticipees,
      heuresInsuffisantes: l.heuresInsuffisantes,
      total:               l.total,
    }))

  return (
    <div className="space-y-5">
      <div
        className="rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-3"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <SelecteurPeriode periode={periode} onChange={setPeriode} />
        <BoutonExport
          onClick={() => exportAnomaliesResumeExcel(donneesExport(), nomFichier)}
          disabled={!exportReady}
          icone={FileSpreadsheet}
          label="Excel"
        />
      </div>

      <div
        className="rounded-2xl border overflow-hidden"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        {chargement ? (
          <Squelette />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pp-divider)', backgroundColor: 'var(--pp-page-bg)' }}>
                  {['Employé', 'Retards', 'Absences', 'Sorties anticipées', 'Heures insuf.', 'Total'].map(col => (
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
                {lignes.map(l => {
                  const initiales = `${l.prenom[0] ?? ''}${l.nom[0] ?? ''}`.toUpperCase()

                  return (
                    <tr key={l.cle} style={{ borderTop: '1px solid var(--pp-divider)' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: couleurAvatar(l.nom) }}
                          >
                            {initiales}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                              {l.prenom} {l.nom}
                            </p>
                            {l.matricule && (
                              <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                                {l.matricule}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <CompteurAnomalie valeur={l.retards} couleur="#f59e0b" />
                      </td>
                      <td className="px-5 py-3.5">
                        <CompteurAnomalie valeur={l.absences} couleur="#ef4444" />
                      </td>
                      <td className="px-5 py-3.5">
                        <CompteurAnomalie valeur={l.sortiesAnticipees} couleur="#8b5cf6" />
                      </td>
                      <td className="px-5 py-3.5">
                        <CompteurAnomalie valeur={l.heuresInsuffisantes} couleur="#06b6d4" />
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-sm font-bold tabular-nums"
                          style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
                        >
                          {l.total}
                        </span>
                      </td>
                    </tr>
                  )
                })}

                {lignes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <AlertTriangle
                        size={32}
                        strokeWidth={1.5}
                        className="mx-auto mb-3 opacity-20"
                        style={{ color: 'var(--pp-text-muted)' }}
                      />
                      <p className="text-sm font-medium" style={{ color: 'var(--pp-text-muted)' }}>
                        Aucune anomalie sur cette période
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
  )
}

// ── Page principale ──────────────────────────────────────────────────────────

const ONGLETS: { id: Onglet; label: string; Icone: React.ElementType }[] = [
  { id: 'presence',  label: 'Présence',  Icone: UserCheck     },
  { id: 'conges',    label: 'Congés',    Icone: Calendar      },
  { id: 'anomalies', label: 'Anomalies', Icone: AlertTriangle },
]

export default function PageRapports() {
  const [onglet, setOnglet] = useState<Onglet>('presence')

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader
        title="Rapports"
        subtitle="Analyse et export des données RH"
      />

      <div className="px-6 py-6 space-y-5">
        {/* Barre d'onglets */}
        <div
          className="rounded-2xl border p-1 flex gap-1 w-fit"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {ONGLETS.map(({ id, label, Icone }) => (
            <button
              key={id}
              onClick={() => setOnglet(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={
                onglet === id
                  ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
                  : { color: 'var(--pp-text-secondary)' }
              }
            >
              <Icone size={15} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        {/* Contenu de l'onglet actif */}
        {onglet === 'presence'  && <OngletPresence />}
        {onglet === 'conges'    && <OngletConges />}
        {onglet === 'anomalies' && <OngletAnomalies />}
      </div>
    </div>
  )
}
