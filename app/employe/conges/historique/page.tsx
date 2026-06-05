'use client'

import { useEffect, useState } from 'react'
import {
  Calendar, CheckCircle, Clock, XCircle,
  Plus, MessageSquare, Stethoscope, Sparkles,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Conge {
  _id: string
  date_debut: string
  date_fin: string
  type: 'annuel' | 'maladie' | 'exceptionnel'
  motif: string
  statut: 'en_attente' | 'valide' | 'refuse'
  commentaire?: string
  dateValidation?: string
  createdAt: string
}

type FiltreStatut = 'tous' | 'en_attente' | 'valide' | 'refuse'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nbJours(debut: string, fin: string): number {
  const d = new Date(debut)
  const f = new Date(fin)
  return Math.max(1, Math.floor((f.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ─── Config par type ──────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  annuel:       { label: 'Annuel',       icone: Calendar,    couleur: '#6366f1' },
  maladie:      { label: 'Maladie',      icone: Stethoscope, couleur: '#ef4444' },
  exceptionnel: { label: 'Exceptionnel', icone: Sparkles,    couleur: '#f59e0b' },
}

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', couleur: '#f59e0b', bg: '#f59e0b18', icone: Clock       },
  valide:     { label: 'Validé',     couleur: '#16a34a', bg: '#16a34a18', icone: CheckCircle },
  refuse:     { label: 'Refusé',     couleur: '#ef4444', bg: '#ef444418', icone: XCircle     },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PageHistoriqueConges() {
  const [conges, setConges] = useState<Conge[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtre, setFiltre] = useState<FiltreStatut>('tous')

  useEffect(() => {
    const charger = async () => {
      setChargement(true)
      try {
        const res = await fetch('/api/conges')
        const d = await res.json()
        if (d.success) setConges(d.data)
      } catch { /* ignore */ }
      finally { setChargement(false) }
    }
    charger()
  }, [])

  // ── Statistiques ────────────────────────────────────────────────────────────
  const joursValides = conges
    .filter(c => c.statut === 'valide')
    .reduce((acc, c) => acc + nbJours(c.date_debut, c.date_fin), 0)

  const stats = {
    total:      conges.length,
    joursValides,
    en_attente: conges.filter(c => c.statut === 'en_attente').length,
  }

  // ── Onglets ─────────────────────────────────────────────────────────────────
  const onglets: { key: FiltreStatut; label: string; count: number }[] = [
    { key: 'tous',       label: 'Tous',       count: conges.length },
    { key: 'en_attente', label: 'En attente', count: stats.en_attente },
    { key: 'valide',     label: 'Validés',    count: conges.filter(c => c.statut === 'valide').length },
    { key: 'refuse',     label: 'Refusés',    count: conges.filter(c => c.statut === 'refuse').length },
  ]

  const affichees = filtre === 'tous' ? conges : conges.filter(c => c.statut === filtre)

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>

      {/* ── Header sticky ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 px-4 pt-10 pb-4 border-b"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
            Mes demandes de congé
          </h1>
          <a
            href="/employe/conges"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#6366f1' }}
          >
            <Plus size={13} strokeWidth={2.5} />
            Nouvelle
          </a>
        </div>

        {/* Onglets filtre */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
          {onglets.map(o => (
            <button
              key={o.key}
              onClick={() => setFiltre(o.key)}
              className="flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1"
              style={{
                backgroundColor: filtre === o.key ? 'var(--pp-card-bg)' : 'transparent',
                color:           filtre === o.key ? '#6366f1'            : 'var(--pp-text-muted)',
                boxShadow:       filtre === o.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {o.label}
              {o.count > 0 && (
                <span
                  className="text-[9px] font-bold px-1 py-0.5 rounded-full tabular-nums"
                  style={{
                    backgroundColor: filtre === o.key ? '#6366f118' : 'var(--pp-card-border)',
                    color:           filtre === o.key ? '#6366f1'    : 'var(--pp-text-muted)',
                  }}
                >
                  {o.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 pt-5 pb-8 space-y-4 max-w-lg mx-auto">

        {/* ── Cartes résumé ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Demandes',     val: chargement ? '—' : String(stats.total),      couleur: '#6366f1', icone: Calendar      },
            { label: 'Jours validés',val: chargement ? '—' : `${stats.joursValides}j`, couleur: '#16a34a', icone: CheckCircle   },
            { label: 'En attente',   val: chargement ? '—' : String(stats.en_attente), couleur: '#f59e0b', icone: Clock         },
          ].map(({ label, val, couleur, icone: Icone }) => (
            <div
              key={label}
              className="rounded-2xl border p-3 text-center"
              style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
            >
              <Icone size={16} strokeWidth={2} className="mx-auto mb-1.5" style={{ color: couleur }} />
              <p
                className="text-xl font-bold tabular-nums"
                style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
              >
                {val}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--pp-text-muted)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* ── Liste des demandes ───────────────────────────────────────────── */}
        {chargement ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-4 animate-pulse"
                style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-5 w-24 rounded-full bg-gray-200" />
                  <div className="h-5 w-20 rounded-full bg-gray-100" />
                </div>
                <div className="h-3 w-40 rounded bg-gray-200 mb-2" />
                <div className="h-3 w-56 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : affichees.length === 0 ? (
          <div
            className="rounded-2xl border p-12 flex flex-col items-center gap-3 text-center"
            style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: '#6366f112', color: '#6366f1' }}
            >
              <Calendar size={26} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                {filtre === 'tous' ? 'Aucune demande pour l\'instant' : 'Aucune demande dans cette catégorie'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--pp-text-muted)' }}>
                Vos demandes de congé apparaîtront ici
              </p>
            </div>
            <a
              href="/employe/conges"
              className="mt-1 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
              style={{ backgroundColor: '#6366f1' }}
            >
              <Plus size={14} strokeWidth={2.5} />
              Faire une demande
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {affichees.map(conge => {
              const typeCfg   = TYPE_CONFIG[conge.type]   ?? TYPE_CONFIG.annuel
              const statutCfg = STATUT_CONFIG[conge.statut] ?? STATUT_CONFIG.en_attente
              const StatutIcone = statutCfg.icone
              const TypeIcone   = typeCfg.icone
              const jours = nbJours(conge.date_debut, conge.date_fin)

              return (
                <div
                  key={conge._id}
                  className="rounded-2xl border p-4 space-y-3"
                  style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
                >
                  {/* Ligne 1 : type + statut */}
                  <div className="flex items-center justify-between">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: `${typeCfg.couleur}18`, color: typeCfg.couleur }}
                    >
                      <TypeIcone size={11} strokeWidth={2.5} />
                      {typeCfg.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: statutCfg.bg, color: statutCfg.couleur }}
                    >
                      <StatutIcone size={11} strokeWidth={2.5} />
                      {statutCfg.label}
                    </span>
                  </div>

                  {/* Ligne 2 : dates + durée */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} strokeWidth={2} style={{ color: 'var(--pp-text-muted)', flexShrink: 0 }} />
                      <p className="text-sm" style={{ color: 'var(--pp-text-primary)' }}>
                        {fmtDate(conge.date_debut)}
                        <span style={{ color: 'var(--pp-text-muted)' }}> → </span>
                        {fmtDate(conge.date_fin)}
                      </p>
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-lg"
                      style={{
                        backgroundColor: `${typeCfg.couleur}12`,
                        color: typeCfg.couleur,
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {jours}j
                    </span>
                  </div>

                  {/* Ligne 3 : motif */}
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--pp-text-secondary)' }}
                  >
                    {conge.motif}
                  </p>

                  {/* Commentaire admin — affiché seulement si présent */}
                  {conge.commentaire && (
                    <div
                      className="flex items-start gap-2 px-3 py-2.5 rounded-xl"
                      style={{ backgroundColor: `${statutCfg.couleur}0e`, border: `1px solid ${statutCfg.couleur}25` }}
                    >
                      <MessageSquare size={12} strokeWidth={2} className="mt-0.5 shrink-0" style={{ color: statutCfg.couleur }} />
                      <p className="text-xs italic leading-relaxed" style={{ color: statutCfg.couleur }}>
                        {conge.commentaire}
                      </p>
                    </div>
                  )}

                  {/* Date de traitement */}
                  {conge.dateValidation && conge.statut !== 'en_attente' && (
                    <p className="text-[10px] text-right" style={{ color: 'var(--pp-text-muted)' }}>
                      Traité le {fmtDate(conge.dateValidation)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
