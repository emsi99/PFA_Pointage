'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Calendar, CheckCircle, XCircle, Clock,
  AlertCircle, Users, X, MessageSquare,
} from 'lucide-react'
import AdminHeader from '@/components/layout/AdminHeader'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Employe {
  _id: string
  nom: string
  prenom: string
  matricule?: string
}

interface Conge {
  _id: string
  user_id: Employe | null
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
type ActionModal = 'valide' | 'refuse'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nbJours(debut: string, fin: string): number {
  const d = new Date(debut)
  const f = new Date(fin)
  return Math.max(1, Math.floor((f.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)) + 1)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const TYPE_LABELS: Record<string, string> = {
  annuel: 'Annuel',
  maladie: 'Maladie',
  exceptionnel: 'Exceptionnel',
}

const TYPE_COLORS: Record<string, string> = {
  annuel: '#6366f1',
  maladie: '#ef4444',
  exceptionnel: '#f59e0b',
}

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', couleur: '#f59e0b', bg: '#f59e0b18' },
  valide:     { label: 'Validé',     couleur: '#16a34a', bg: '#16a34a18' },
  refuse:     { label: 'Refusé',     couleur: '#ef4444', bg: '#ef444418' },
}

// ─── Composant carte stat ─────────────────────────────────────────────────────

function CarteStat({
  label, val, icone: Icone, couleur, chargement,
}: {
  label: string; val: number; icone: React.ElementType; couleur: string; chargement: boolean
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
          <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
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

// ─── Modal confirmation ───────────────────────────────────────────────────────

interface ModalProps {
  action: ActionModal
  conge: Conge
  onConfirm: (commentaire: string) => void
  onClose: () => void
  envoi: boolean
}

function ModalConfirmation({ action, conge, onConfirm, onClose, envoi }: ModalProps) {
  const [commentaire, setCommentaire] = useState('')
  const employe = conge.user_id
  const nomEmploye = employe ? `${employe.prenom} ${employe.nom}` : 'Employé inconnu'
  const isValide = action === 'valide'
  const couleurAction = isValide ? '#16a34a' : '#ef4444'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={e => { if (e.key === 'Escape') onClose() }}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--pp-card-bg)', border: `1px solid var(--pp-card-border)` }}
      >
        {/* En-tête */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'var(--pp-divider)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${couleurAction}18`, color: couleurAction }}
            >
              {isValide
                ? <CheckCircle size={18} strokeWidth={2} />
                : <XCircle size={18} strokeWidth={2} />
              }
            </div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
              {isValide ? 'Valider la demande' : 'Refuser la demande'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--pp-text-muted)' }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 space-y-4">
          {/* Récap demande */}
          <div
            className="rounded-xl p-4 space-y-2.5"
            style={{ backgroundColor: 'var(--pp-page-bg)' }}
          >
            {[
              { label: 'Employé', val: nomEmploye },
              { label: 'Type',    val: TYPE_LABELS[conge.type] ?? conge.type },
              { label: 'Période', val: `${fmtDate(conge.date_debut)} → ${fmtDate(conge.date_fin)}` },
              { label: 'Durée',   val: `${nbJours(conge.date_debut, conge.date_fin)} jour(s)` },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span style={{ color: 'var(--pp-text-muted)' }}>{label}</span>
                <span className="font-medium" style={{ color: 'var(--pp-text-primary)' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* Commentaire facultatif */}
          <div>
            <label htmlFor="conge-commentaire" className="flex items-center gap-1.5 text-xs font-medium mb-2" style={{ color: 'var(--pp-text-secondary)' }}>
              <MessageSquare size={12} strokeWidth={2} />
              Commentaire (facultatif)
            </label>
            <textarea
              id="conge-commentaire"
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder={isValide ? 'Ajouter une note…' : 'Précisez le motif du refus…'}
              rows={3}
              className="w-full text-sm rounded-xl px-4 py-3 border resize-none outline-none"
              style={{
                backgroundColor: 'var(--pp-input-bg)',
                borderColor: 'var(--pp-card-border)',
                color: 'var(--pp-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={envoi}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium border disabled:opacity-40"
            style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)', backgroundColor: 'var(--pp-card-bg)' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(commentaire)}
            disabled={envoi}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: couleurAction }}
          >
            {envoi ? 'Traitement…' : isValide ? 'Confirmer' : 'Refuser'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PageAdminConges() {
  const [conges, setConges] = useState<Conge[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtre, setFiltre] = useState<FiltreStatut>('tous')
  const [modal, setModal] = useState<{ conge: Conge; action: ActionModal } | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(null)

  const charger = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/conges/admin')
      const d = await res.json()
      if (d.success) setConges(d.data)
    } catch { /* ignore */ }
    finally { setChargement(false) }
  }, [])

  useEffect(() => {
    const t = window.setTimeout(() => charger(), 0)
    return () => window.clearTimeout(t)
  }, [charger])

  const afficherToast = (message: string, ok: boolean) => {
    setToast({ message, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const traiter = async (commentaire: string) => {
    if (!modal) return
    setEnvoi(true)
    try {
      const res = await fetch(`/api/conges/${modal.conge._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: modal.action, commentaire }),
      })
      const d = await res.json()
      if (d.success) {
        afficherToast(
          modal.action === 'valide' ? 'Demande validée' : 'Demande refusée',
          modal.action === 'valide'
        )
        setModal(null)
        charger()
      } else {
        afficherToast(d.message ?? 'Erreur', false)
      }
    } catch {
      afficherToast('Erreur réseau', false)
    } finally {
      setEnvoi(false)
    }
  }

  // Compteurs
  const stats = {
    total:      conges.length,
    en_attente: conges.filter(c => c.statut === 'en_attente').length,
    valide:     conges.filter(c => c.statut === 'valide').length,
    refuse:     conges.filter(c => c.statut === 'refuse').length,
  }

  const affichees = filtre === 'tous' ? conges : conges.filter(c => c.statut === filtre)

  const onglets: { key: FiltreStatut; label: string; count: number }[] = [
    { key: 'tous',       label: 'Tous',       count: stats.total      },
    { key: 'en_attente', label: 'En attente', count: stats.en_attente },
    { key: 'valide',     label: 'Validés',    count: stats.valide     },
    { key: 'refuse',     label: 'Refusés',    count: stats.refuse     },
  ]

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader
        title="Demandes de congé"
        subtitle={chargement ? 'Chargement…' : `${stats.en_attente} en attente de traitement`}
      />

      <div className="px-6 py-6 space-y-5">

        {/* Cartes stat */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CarteStat label="Total"      val={stats.total}      icone={Calendar}     couleur="#6366f1" chargement={chargement} />
          <CarteStat label="En attente" val={stats.en_attente} icone={Clock}        couleur="#f59e0b" chargement={chargement} />
          <CarteStat label="Validées"   val={stats.valide}     icone={CheckCircle}  couleur="#16a34a" chargement={chargement} />
          <CarteStat label="Refusées"   val={stats.refuse}     icone={XCircle}      couleur="#ef4444" chargement={chargement} />
        </div>

        {/* Onglets filtre */}
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{ backgroundColor: 'var(--pp-card-bg)', border: `1px solid var(--pp-card-border)` }}
        >
          {onglets.map(o => (
            <button
              key={o.key}
              onClick={() => setFiltre(o.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={filtre === o.key
                ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
                : { color: 'var(--pp-text-secondary)', backgroundColor: 'transparent' }
              }
            >
              {o.label}
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={filtre === o.key
                  ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#fff' }
                  : { backgroundColor: 'var(--pp-page-bg)', color: 'var(--pp-text-muted)' }
                }
              >
                {o.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tableau */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {chargement ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : affichees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Users size={36} strokeWidth={1.5} style={{ color: 'var(--pp-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                Aucune demande{filtre !== 'tous' ? ' dans cette catégorie' : ''}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px]">
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--pp-divider)`, backgroundColor: 'var(--pp-page-bg)' }}>
                    {['Employé', 'Type', 'Période', 'Durée', 'Motif', 'Statut', 'Actions'].map(col => (
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
                  {affichees.map(conge => {
                    const employe = conge.user_id
                    const nom = employe ? `${employe.prenom} ${employe.nom}` : 'Inconnu'
                    const initiales = employe
                      ? `${employe.prenom?.[0] ?? ''}${employe.nom?.[0] ?? ''}`.toUpperCase()
                      : '?'
                    const couleurType = TYPE_COLORS[conge.type] ?? '#6366f1'
                    const statutCfg = STATUT_CONFIG[conge.statut]
                    const jours = nbJours(conge.date_debut, conge.date_fin)

                    return (
                      <tr
                        key={conge._id}
                        style={{ borderTop: `1px solid var(--pp-divider)` }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                      >
                        {/* Employé */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                              style={{ backgroundColor: couleurType }}
                            >
                              {initiales}
                            </div>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                                {nom}
                              </p>
                              {employe?.matricule && (
                                <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                                  {employe.matricule}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-3.5">
                          <span
                            className="text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: `${couleurType}18`, color: couleurType }}
                          >
                            {TYPE_LABELS[conge.type] ?? conge.type}
                          </span>
                        </td>

                        {/* Période */}
                        <td className="px-5 py-3.5">
                          <p className="text-xs tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>
                            {fmtDate(conge.date_debut)}
                          </p>
                          <p className="text-xs tabular-nums" style={{ color: 'var(--pp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            → {fmtDate(conge.date_fin)}
                          </p>
                        </td>

                        {/* Durée */}
                        <td className="px-5 py-3.5">
                          <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
                          >
                            {jours}j
                          </span>
                        </td>

                        {/* Motif */}
                        <td className="px-5 py-3.5 max-w-[180px]">
                          <p
                            className="text-xs truncate"
                            style={{ color: 'var(--pp-text-secondary)' }}
                            title={conge.motif}
                          >
                            {conge.motif}
                          </p>
                          {conge.commentaire && (
                            <p className="text-xs truncate mt-0.5 italic" style={{ color: 'var(--pp-text-muted)' }} title={conge.commentaire}>
                              {conge.commentaire}
                            </p>
                          )}
                        </td>

                        {/* Statut */}
                        <td className="px-5 py-3.5">
                          <span
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                            style={{ backgroundColor: statutCfg.bg, color: statutCfg.couleur }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statutCfg.couleur }} />
                            {statutCfg.label}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          {conge.statut === 'en_attente' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setModal({ conge, action: 'valide' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                                style={{ backgroundColor: '#16a34a' }}
                              >
                                <CheckCircle size={12} strokeWidth={2.5} />
                                Valider
                              </button>
                              <button
                                onClick={() => setModal({ conge, action: 'refuse' })}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80"
                                style={{ backgroundColor: '#ef4444' }}
                              >
                                <XCircle size={12} strokeWidth={2.5} />
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs px-1" style={{ color: 'var(--pp-text-muted)' }}>
                              {conge.dateValidation ? fmtDate(conge.dateValidation) : '—'}
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <ModalConfirmation
          action={modal.action}
          conge={modal.conge}
          onConfirm={traiter}
          onClose={() => { if (!envoi) setModal(null) }}
          envoi={envoi}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50"
          style={{ backgroundColor: toast.ok ? '#16a34a' : '#ef4444' }}
        >
          {toast.ok
            ? <CheckCircle size={15} strokeWidth={2} />
            : <AlertCircle size={15} strokeWidth={2} />
          }
          {toast.message}
        </div>
      )}
    </div>
  )
}
