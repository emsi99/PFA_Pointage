'use client'

import { useState } from 'react'
import {
  Calendar, Clock, FileText, CheckCircle,
  AlertCircle, ChevronRight, Stethoscope, Sparkles, History,
} from 'lucide-react'

type TypeConge = 'annuel' | 'maladie' | 'exceptionnel'

interface TypeOption {
  value: TypeConge
  label: string
  description: string
  icone: React.ElementType
  couleur: string
}

const TYPES: TypeOption[] = [
  {
    value: 'annuel',
    label: 'Congé annuel',
    description: 'Congé payé sur votre solde',
    icone: Calendar,
    couleur: '#6366f1',
  },
  {
    value: 'maladie',
    label: 'Congé maladie',
    description: 'Arrêt médical ou maladie',
    icone: Stethoscope,
    couleur: '#ef4444',
  },
  {
    value: 'exceptionnel',
    label: 'Congé exceptionnel',
    description: 'Événement familial ou autre',
    icone: Sparkles,
    couleur: '#f59e0b',
  },
]

function calculerJours(debut: string, fin: string): number {
  if (!debut || !fin) return 0
  const d = new Date(debut)
  const f = new Date(fin)
  if (f < d) return 0
  return Math.floor((f.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

function aujourdhui(): string {
  return new Date().toISOString().split('T')[0]
}

export default function PageDemandeConge() {
  const [type, setType] = useState<TypeConge>('annuel')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState(false)

  const nbJours = calculerJours(dateDebut, dateFin)
  const typeActif = TYPES.find(t => t.value === type)!

  const handleDateDebut = (val: string) => {
    setDateDebut(val)
    if (dateFin && dateFin < val) setDateFin(val)
  }

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    setErreur(null)

    if (!dateDebut || !dateFin) {
      setErreur('Veuillez sélectionner les dates de début et de fin.')
      return
    }
    if (!motif.trim()) {
      setErreur('Le motif est obligatoire.')
      return
    }

    setEnvoi(true)
    try {
      const res = await fetch('/api/conges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date_debut: dateDebut, date_fin: dateFin, type, motif }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setErreur(data.message ?? 'Une erreur est survenue.')
        return
      }

      setSucces(true)
    } catch {
      setErreur('Impossible de contacter le serveur.')
    } finally {
      setEnvoi(false)
    }
  }

  if (succes) {
    return (
      <div className="min-h-full px-4 pt-10 pb-8 flex flex-col items-center justify-center max-w-lg mx-auto gap-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: '#6366f118', boxShadow: '0 12px 30px -6px #6366f140' }}
        >
          <CheckCircle size={40} strokeWidth={1.5} style={{ color: '#6366f1' }} />
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pp-text-primary)' }}>
            Demande envoyée
          </h1>
          <p className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>
            Votre demande de {nbJours} jour{nbJours > 1 ? 's' : ''} est en attente de validation par un administrateur.
          </p>
        </div>

        <div
          className="w-full rounded-3xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {[
            { label: 'Type', val: typeActif.label },
            { label: 'Du', val: new Date(dateDebut + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Au', val: new Date(dateFin + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Durée', val: `${nbJours} jour${nbJours > 1 ? 's' : ''}` },
            { label: 'Statut', val: 'En attente' },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>
                {label}
              </span>
              <span className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                {val}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full space-y-3">
          <a
            href="/employe/conges/historique"
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-2 text-sm font-bold text-white transition-all active:scale-95"
            style={{ backgroundColor: '#6366f1', boxShadow: '0 8px 20px -4px #6366f150' }}
          >
            Voir mes demandes
            <ChevronRight size={16} strokeWidth={2.5} />
          </a>
          <button
            onClick={() => {
              setSucces(false)
              setDateDebut('')
              setDateFin('')
              setMotif('')
              setType('annuel')
            }}
            className="w-full rounded-2xl py-3.5 text-sm font-medium border"
            style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)', backgroundColor: 'var(--pp-card-bg)' }}
          >
            Nouvelle demande
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 pt-6 pb-8 max-w-lg mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pp-text-primary)' }}>
            Demande de congé
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--pp-text-muted)' }}>
            Remplissez le formulaire ci-dessous
          </p>
        </div>
        <a
          href="/employe/conges/historique"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0"
          style={{
            borderColor: 'var(--pp-card-border)',
            color: 'var(--pp-text-secondary)',
            backgroundColor: 'var(--pp-card-bg)',
          }}
        >
          <History size={13} strokeWidth={2} />
          Mes demandes
        </a>
      </div>

      <form onSubmit={soumettre} className="space-y-5">

        {/* Sélection du type */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--pp-text-muted)' }}>
            Type de congé
          </p>
          <div className="space-y-2.5">
            {TYPES.map(opt => {
              const actif = type === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all"
                  style={{
                    backgroundColor: actif ? `${opt.couleur}12` : 'var(--pp-card-bg)',
                    borderColor: actif ? opt.couleur : 'var(--pp-card-border)',
                    boxShadow: actif ? `0 0 0 1px ${opt.couleur}` : 'none',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${opt.couleur}18`, color: opt.couleur }}
                  >
                    <opt.icone size={18} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                      {opt.label}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pp-text-muted)' }}>
                      {opt.description}
                    </p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{
                      borderColor: actif ? opt.couleur : 'var(--pp-card-border)',
                      backgroundColor: actif ? opt.couleur : 'transparent',
                    }}
                  >
                    {actif && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dates */}
        <div
          className="rounded-2xl border p-5 space-y-4"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>
            Période
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pp-text-secondary)' }}>
                Date de début
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)' }}
              >
                <Calendar size={14} style={{ color: 'var(--pp-text-muted)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={dateDebut}
                  min={aujourdhui()}
                  onChange={e => handleDateDebut(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: 'var(--pp-text-primary)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pp-text-secondary)' }}>
                Date de fin
              </label>
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
                style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)' }}
              >
                <Calendar size={14} style={{ color: 'var(--pp-text-muted)', flexShrink: 0 }} />
                <input
                  type="date"
                  value={dateFin}
                  min={dateDebut || aujourdhui()}
                  onChange={e => setDateFin(e.target.value)}
                  className="bg-transparent outline-none text-sm w-full"
                  style={{ color: 'var(--pp-text-primary)' }}
                />
              </div>
            </div>
          </div>

          {/* Compteur jours */}
          {nbJours > 0 && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
              style={{ backgroundColor: `${typeActif.couleur}10` }}
            >
              <Clock size={14} style={{ color: typeActif.couleur, flexShrink: 0 }} />
              <p className="text-sm font-semibold" style={{ color: typeActif.couleur }}>
                {nbJours} jour{nbJours > 1 ? 's' : ''} de congé
              </p>
            </div>
          )}
        </div>

        {/* Motif */}
        <div
          className="rounded-2xl border p-5 space-y-3"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="flex items-center gap-2">
            <FileText size={14} style={{ color: 'var(--pp-text-muted)' }} />
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--pp-text-muted)' }}>
              Motif <span style={{ color: '#ef4444' }}>*</span>
            </p>
          </div>
          <textarea
            value={motif}
            onChange={e => setMotif(e.target.value)}
            placeholder="Décrivez brièvement la raison de votre demande…"
            rows={4}
            className="w-full text-sm rounded-xl px-4 py-3 border resize-none outline-none transition-colors"
            style={{
              backgroundColor: 'var(--pp-input-bg)',
              borderColor: motif.trim() ? typeActif.couleur : 'var(--pp-card-border)',
              color: 'var(--pp-text-primary)',
            }}
          />
          <p className="text-xs text-right tabular-nums" style={{ color: 'var(--pp-text-muted)' }}>
            {motif.length} caractère{motif.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Erreur */}
        {erreur && (
          <div
            className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm"
            style={{ backgroundColor: '#ef444412', border: '1px solid #ef444430', color: '#ef4444' }}
          >
            <AlertCircle size={16} strokeWidth={2} className="shrink-0 mt-0.5" />
            {erreur}
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={envoi}
          className="w-full rounded-2xl py-4 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60"
          style={{
            backgroundColor: typeActif.couleur,
            boxShadow: `0 8px 20px -4px ${typeActif.couleur}50`,
          }}
        >
          {envoi ? 'Envoi en cours…' : 'Soumettre la demande'}
        </button>

      </form>
    </div>
  )
}
