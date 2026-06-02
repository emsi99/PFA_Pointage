'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays, CheckCircle, ChevronLeft, ChevronRight, Clock,
  FilterX, Search, Timer, UserCheck, XCircle,
} from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'

interface Employe {
  _id: string
  nom: string
  prenom: string
  email: string
  departement?: string
}

interface UtilisateurPointage extends Employe {
  role?: 'admin' | 'employe'
  statut?: 'actif' | 'inactif'
}

interface Pointage {
  _id: string
  user_id: UtilisateurPointage | string
  date: string
  heure: string
  type: 'entree' | 'sortie'
  latitude: number
  longitude: number
  valide: boolean
  anomalie?: string
  createdAt: string
}

interface Filtres {
  recherche: string
  userId: string
  type: string
  statut: string
  dateDebut: string
  dateFin: string
}

const ELEMENTS_PAR_PAGE = 10

const filtresInitiaux: Filtres = {
  recherche: '',
  userId: '',
  type: '',
  statut: '',
  dateDebut: '',
  dateFin: '',
}

const couleurAvatar = (texte: string) => {
  const palette = ['#2563eb', '#16a34a', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#db2777']
  return palette[(texte.charCodeAt(0) || 0) % palette.length]
}

const getUtilisateur = (pointage: Pointage) =>
  typeof pointage.user_id === 'object' ? pointage.user_id : null

const nomComplet = (user: UtilisateurPointage | null) =>
  user ? `${user.prenom} ${user.nom}`.trim() : 'Utilisateur inconnu'

function Stat({ label, val, icone: Icone, couleur, chargement }: {
  label: string
  val: number
  icone: React.ElementType
  couleur: string
  chargement: boolean
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex items-center gap-3"
      style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${couleur}18`, color: couleur }}
      >
        <Icone size={17} strokeWidth={2} />
      </div>
      {chargement ? (
        <div className="space-y-1.5">
          <div className="h-5 w-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <div>
          <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
            {val}
          </p>
          <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>{label}</p>
        </div>
      )}
    </div>
  )
}

export default function PagePointagesAdmin() {
  const [pointages, setPointages] = useState<Pointage[]>([])
  const [employes, setEmployes] = useState<Employe[]>([])
  const [filtres, setFiltres] = useState<Filtres>(filtresInitiaux)
  const [chargement, setChargement] = useState(true)
  const [page, setPage] = useState(1)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const params = new URLSearchParams({ limite: '500' })
      Object.entries(filtres).forEach(([cle, valeur]) => {
        if (!valeur) return
        if (cle === 'statut') params.set('valide', valeur)
        else params.set(cle, valeur)
      })

      const [resPointages, resEmployes] = await Promise.all([
        fetch(`/api/pointages?${params.toString()}`),
        fetch('/api/employes'),
      ])

      const [dataPointages, dataEmployes] = await Promise.all([
        resPointages.json(),
        resEmployes.json(),
      ])

      if (dataPointages.success) setPointages(dataPointages.data)
      if (dataEmployes.success) setEmployes(dataEmployes.data)
    } catch {
      setPointages([])
    } finally {
      setChargement(false)
    }
  }, [filtres])

  useEffect(() => {
    const attente = window.setTimeout(() => {
      setPage(1)
      charger()
    }, 250)

    return () => window.clearTimeout(attente)
  }, [charger])

  const stats = useMemo(() => ({
    total: pointages.length,
    entrees: pointages.filter(p => p.type === 'entree').length,
    sorties: pointages.filter(p => p.type === 'sortie').length,
    anomalies: pointages.filter(p => !p.valide || p.anomalie).length,
  }), [pointages])

  const totalPages = Math.max(1, Math.ceil(pointages.length / ELEMENTS_PAR_PAGE))
  const pageCourante = Math.min(page, totalPages)
  const pointagesPagines = pointages.slice((pageCourante - 1) * ELEMENTS_PAR_PAGE, pageCourante * ELEMENTS_PAR_PAGE)
  const filtresActifs = Object.values(filtres).some(Boolean)

  const changerFiltre = (cle: keyof Filtres, valeur: string) => {
    setFiltres(f => ({ ...f, [cle]: valeur }))
    setPage(1)
  }

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader
        title="Pointages"
        subtitle={chargement ? 'Chargement...' : `${stats.total} pointages trouves`}
      />

      <div className="px-6 py-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total" val={stats.total} icone={Timer} couleur="#2563eb" chargement={chargement} />
          <Stat label="Entrees" val={stats.entrees} icone={UserCheck} couleur="#16a34a" chargement={chargement} />
          <Stat label="Sorties" val={stats.sorties} icone={Clock} couleur="#f59e0b" chargement={chargement} />
          <Stat label="Anomalies" val={stats.anomalies} icone={XCircle} couleur="#ef4444" chargement={chargement} />
        </div>

        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--pp-text-muted)' }} />
              <input
                type="text"
                placeholder="Rechercher nom, email, departement..."
                value={filtres.recherche}
                onChange={e => changerFiltre('recherche', e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border"
                style={{
                  backgroundColor: 'var(--pp-input-bg)',
                  borderColor: 'var(--pp-card-border)',
                  color: 'var(--pp-text-primary)',
                  outline: 'none',
                }}
              />
            </div>

            <select
              value={filtres.userId}
              onChange={e => changerFiltre('userId', e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border min-w-0"
              style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }}
            >
              <option value="">Tous les employes</option>
              {employes.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.prenom} {emp.nom}</option>
              ))}
            </select>

            <select
              value={filtres.type}
              onChange={e => changerFiltre('type', e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border min-w-0"
              style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }}
            >
              <option value="">Tous les types</option>
              <option value="entree">Entree</option>
              <option value="sortie">Sortie</option>
            </select>

            <select
              value={filtres.statut}
              onChange={e => changerFiltre('statut', e.target.value)}
              className="px-3 py-2.5 text-sm rounded-lg border min-w-0"
              style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }}
            >
              <option value="">Tous les statuts</option>
              <option value="true">Valide</option>
              <option value="false">Anomalie</option>
            </select>

            <button
              type="button"
              onClick={() => setFiltres(filtresInitiaux)}
              disabled={!filtresActifs}
              className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-lg border disabled:opacity-40"
              style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}
            >
              <FilterX size={14} strokeWidth={2} />
              Effacer
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 max-w-xl">
            <label className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border"
              style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}>
              <CalendarDays size={14} strokeWidth={2} />
              <input
                type="date"
                value={filtres.dateDebut}
                onChange={e => changerFiltre('dateDebut', e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: 'var(--pp-text-primary)' }}
              />
            </label>
            <label className="flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg border"
              style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}>
              <CalendarDays size={14} strokeWidth={2} />
              <input
                type="date"
                value={filtres.dateFin}
                onChange={e => changerFiltre('dateFin', e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
                style={{ color: 'var(--pp-text-primary)' }}
              />
            </label>
          </div>
        </div>

        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {chargement ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
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
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid var(--pp-divider)`, backgroundColor: 'var(--pp-page-bg)' }}>
                      {['Employe', 'Date', 'Heure', 'Type', 'Statut', 'Position'].map(col => (
                        <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wide"
                          style={{ color: 'var(--pp-text-muted)' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pointagesPagines.map(pointage => {
                      const user = getUtilisateur(pointage)
                      const nom = nomComplet(user)
                      const initiales = user ? `${user.prenom[0] ?? ''}${user.nom[0] ?? ''}`.toUpperCase() : '?'
                      const date = new Date(`${pointage.date}T00:00:00`).toLocaleDateString('fr-FR')

                      return (
                        <tr key={pointage._id} style={{ borderTop: `1px solid var(--pp-divider)` }}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                                style={{ backgroundColor: couleurAvatar(nom) }}
                              >
                                {initiales}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--pp-text-primary)' }}>
                                  {nom}
                                </p>
                                <p className="text-xs truncate" style={{ color: 'var(--pp-text-muted)' }}>
                                  {user?.email ?? 'Compte non renseigne'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm tabular-nums" style={{ color: 'var(--pp-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                            {date}
                          </td>
                          <td className="px-5 py-3.5 text-sm tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {pointage.heure}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                              style={pointage.type === 'entree'
                                ? { backgroundColor: '#16a34a18', color: '#16a34a' }
                                : { backgroundColor: '#f59e0b18', color: '#f59e0b' }}>
                              {pointage.type === 'entree' ? 'Entree' : 'Sortie'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                              style={pointage.valide
                                ? { backgroundColor: '#16a34a18', color: '#16a34a' }
                                : { backgroundColor: '#ef444418', color: '#ef4444' }}>
                              {pointage.valide ? <CheckCircle size={12} /> : <XCircle size={12} />}
                              {pointage.valide ? 'Valide' : (pointage.anomalie ?? 'Anomalie')}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs tabular-nums" style={{ color: 'var(--pp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {pointage.latitude.toFixed(5)}, {pointage.longitude.toFixed(5)}
                          </td>
                        </tr>
                      )
                    })}
                    {pointagesPagines.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                          Aucun pointage trouve
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {pointages.length > ELEMENTS_PAR_PAGE && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: 'var(--pp-divider)' }}>
                  <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                    {(pageCourante - 1) * ELEMENTS_PAR_PAGE + 1}-{Math.min(pageCourante * ELEMENTS_PAR_PAGE, pointages.length)} sur {pointages.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={pageCourante === 1}
                      className="p-1.5 rounded-lg border disabled:opacity-30"
                      style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}
                    >
                      <ChevronLeft size={14} strokeWidth={2} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
                        style={p === pageCourante
                          ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
                          : { border: `1px solid var(--pp-card-border)`, color: 'var(--pp-text-secondary)' }}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={pageCourante === totalPages}
                      className="p-1.5 rounded-lg border disabled:opacity-30"
                      style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}
                    >
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
