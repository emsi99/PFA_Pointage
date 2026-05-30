'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, CheckCircle, Clock, UserX } from 'lucide-react'

interface Pointage {
  _id: string
  date: string
  heure: string
  type: 'entree' | 'sortie'
  valide: boolean
}

interface JourPointage {
  date: string
  entree?: Pointage
  sortie?: Pointage
}

const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function PageHistorique() {
  const [onglet, setOnglet] = useState<'jour' | 'mois' | 'annee'>('mois')
  const [pointages, setPointages] = useState<Pointage[]>([])
  const [chargement, setChargement] = useState(true)
  const [moisActuel, setMoisActuel] = useState(new Date())

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/pointages?limite=50')
      const d = await res.json()
      if (d.success) setPointages(d.data)
    } catch { /* ignore */ }
    finally { setChargement(false) }
  }, [])

  useEffect(() => { charger() }, [charger])

  // Grouper par jour
  const joursMap = new Map<string, JourPointage>()
  pointages.forEach(p => {
    const moisP = new Date(p.date + 'T00:00:00')
    if (moisP.getMonth() !== moisActuel.getMonth() || moisP.getFullYear() !== moisActuel.getFullYear()) return
    if (!joursMap.has(p.date)) joursMap.set(p.date, { date: p.date })
    const j = joursMap.get(p.date)!
    if (p.type === 'entree') j.entree = p
    else j.sortie = p
  })
  const jours = Array.from(joursMap.values()).sort((a, b) => b.date.localeCompare(a.date))

  const presences = jours.filter(j => j.entree).length
  const retards = jours.filter(j => {
    if (!j.entree) return false
    const [h, m] = j.entree.heure.split(':').map(Number)
    return h > 8 || (h === 8 && m > 15)
  }).length
  const absences = Math.max(0, new Date().getDate() - jours.length)

  const nomMois = `${MOIS[moisActuel.getMonth()]} ${moisActuel.getFullYear()}`

  const moisPrec = () => setMoisActuel(d => new Date(d.getFullYear(), d.getMonth() - 1))
  const moisSuiv = () => setMoisActuel(d => new Date(d.getFullYear(), d.getMonth() + 1))

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 pt-10 pb-4 border-b"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <h1 className="text-base font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
          Mon historique
        </h1>

        {/* Onglets */}
        <div className="flex gap-1 mt-3 p-1 rounded-lg" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
          {(['jour', 'mois', 'annee'] as const).map(o => (
            <button
              key={o}
              onClick={() => setOnglet(o)}
              className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors"
              style={{
                backgroundColor: onglet === o ? 'var(--pp-card-bg)' : 'transparent',
                color: onglet === o ? 'var(--pp-accent)' : 'var(--pp-text-muted)',
                boxShadow: onglet === o ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {o === 'jour' ? 'Jour' : o === 'mois' ? 'Mois' : 'Année'}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-5 pb-8 space-y-4 max-w-lg mx-auto">
        {/* Navigation mois */}
        <div className="flex items-center justify-between">
          <button onClick={moisPrec} className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)', backgroundColor: 'var(--pp-card-bg)' }}>
            <ChevronLeft size={16} strokeWidth={2} />
          </button>
          <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>{nomMois}</p>
          <button onClick={moisSuiv} className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)', backgroundColor: 'var(--pp-card-bg)' }}>
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>

        {/* 3 compteurs */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Présence',  val: presences, couleur: '#16a34a', icone: CheckCircle },
            { label: 'Retards',   val: retards,   couleur: '#f59e0b', icone: Clock },
            { label: 'Absences',  val: absences,  couleur: '#ef4444', icone: UserX },
          ].map(({ label, val, couleur, icone: Icone }) => (
            <div key={label} className="rounded-2xl border p-3 text-center"
              style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
              <Icone size={16} strokeWidth={2} className="mx-auto mb-1.5" style={{ color: couleur }} />
              <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                {chargement ? '—' : `${val}j`}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--pp-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Liste des jours */}
        {chargement ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-2xl border p-4 animate-pulse"
                style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
                <div className="h-4 w-24 rounded bg-gray-200 mb-2" />
                <div className="h-3 w-40 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : jours.length === 0 ? (
          <div className="rounded-2xl border p-10 text-center"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
            <p className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>
              Aucun pointage ce mois-ci
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jours.map(j => {
              const d = new Date(j.date + 'T00:00:00')
              const nomJour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })
              const retard = j.entree ? (() => {
                const [h, m] = j.entree!.heure.split(':').map(Number)
                return h > 8 || (h === 8 && m > 15)
              })() : false
              return (
                <div key={j.date} className="rounded-2xl border p-4"
                  style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <p className="text-sm font-medium capitalize" style={{ color: 'var(--pp-text-primary)' }}>
                      {nomJour}
                    </p>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={!j.entree
                        ? { backgroundColor: '#ef444418', color: '#ef4444' }
                        : retard
                        ? { backgroundColor: '#f59e0b18', color: '#f59e0b' }
                        : { backgroundColor: '#16a34a18', color: '#16a34a' }}>
                      {!j.entree ? 'Absent' : retard ? 'En retard' : 'Présent'}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#16a34a]" />
                      <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>Entrée</p>
                      <p className="text-xs tabular-nums font-medium" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {j.entree?.heure ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#f59e0b]" />
                      <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>Sortie</p>
                      <p className="text-xs tabular-nums font-medium" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {j.sortie?.heure ?? '—'}
                      </p>
                    </div>
                    {j.entree && j.sortie && (
                      <CheckCircle size={14} strokeWidth={2} color="#16a34a" className="ml-auto shrink-0" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
