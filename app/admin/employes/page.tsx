'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Trash2, Pencil, MoreVertical,
  Users, UserCheck, UserX, Shield,
  ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle,
} from 'lucide-react'
import { getUser, type Utilisateur } from '@/lib/auth-client'

interface Employe {
  _id: string
  nom: string
  prenom: string
  email: string
  departement?: string
  role: 'admin' | 'employe'
  statut: 'actif' | 'inactif'
  createdAt: string
}

interface FormulaireEmploye {
  prenom: string; nom: string; email: string
  password: string; departement: string; role: string
}

interface Toast { message: string; type: 'success' | 'error' }

const ELEMENTS_PAR_PAGE = 8

const departements = [
  'Informatique', 'Ressources humaines', 'Comptabilité',
  'Commercial', 'Technique', 'Direction',
]

const initiales = (p: string, n: string) => `${p[0] ?? ''}${n[0] ?? ''}`.toUpperCase()
const couleurAvatar = (s: string) => {
  const pal = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']
  return pal[(s.charCodeAt(0) ?? 0) % pal.length]
}

function Stat({ label, val, icone: Icone, c, load }: {
  label: string; val: number; icone: React.ElementType; c: string; load: boolean
}) {
  return (
    <div className="rounded-2xl border p-4 flex items-center gap-3"
      style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${c}18`, color: c }}>
        <Icone size={17} strokeWidth={2} />
      </div>
      {load
        ? <div className="space-y-1.5"><div className="h-5 w-10 bg-gray-200 rounded animate-pulse" /><div className="h-3 w-16 bg-gray-100 rounded animate-pulse" /></div>
        : <div>
            <p className="text-xl font-bold tabular-nums" style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}>{val}</p>
            <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>{label}</p>
          </div>
      }
    </div>
  )
}

export default function PageEmployes() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [chargement, setChargement] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [page, setPage] = useState(1)
  const [modalOuverte, setModalOuverte] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [creation, setCreation] = useState(false)
  const [formulaire, setFormulaire] = useState<FormulaireEmploye>({
    prenom: '', nom: '', email: '', password: '', departement: '', role: 'employe',
  })

  const afficherToast = (message: string, type: Toast['type']) => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const chargerEmployes = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch('/api/employes')
      const d = await res.json()
      if (d.success) setEmployes(d.data)
    } catch { /* ignore */ }
    finally { setChargement(false) }
  }, [])

  useEffect(() => {
    getUser().then(u => setUtilisateur(u))
    chargerEmployes()
  }, [chargerEmployes])

  const supprimer = async (id: string, nom: string) => {
    if (!confirm(`Supprimer ${nom} ? Cette action est irréversible.`)) return
    setMenuOuvert(null)
    try {
      const res = await fetch(`/api/employes/${id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) { afficherToast('Employé supprimé', 'success'); chargerEmployes() }
      else afficherToast(d.message, 'error')
    } catch { afficherToast('Erreur réseau', 'error') }
  }

  const creer = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreation(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulaire),
      })
      const d = await res.json()
      if (d.success) {
        afficherToast('Compte créé', 'success')
        setModalOuverte(false)
        setFormulaire({ prenom: '', nom: '', email: '', password: '', departement: '', role: 'employe' })
        chargerEmployes()
      } else afficherToast(d.message, 'error')
    } catch { afficherToast('Erreur réseau', 'error') }
    finally { setCreation(false) }
  }

  const champ = (k: keyof FormulaireEmploye) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormulaire(f => ({ ...f, [k]: e.target.value }))

  const filtres = employes.filter(e => {
    const q = recherche.toLowerCase()
    const ok = !q || e.nom.toLowerCase().includes(q) || e.prenom.toLowerCase().includes(q) || e.email.toLowerCase().includes(q)
    const okS = !filtreStatut || e.statut === filtreStatut
    return ok && okS
  })

  const totalPages = Math.ceil(filtres.length / ELEMENTS_PAR_PAGE)
  const pagines = filtres.slice((page - 1) * ELEMENTS_PAR_PAGE, page * ELEMENTS_PAR_PAGE)
  const stats = {
    total: employes.length,
    actifs: employes.filter(e => e.statut === 'actif').length,
    inactifs: employes.filter(e => e.statut === 'inactif').length,
    admins: employes.filter(e => e.role === 'admin').length,
  }

  const inputCls = 'w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40'

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Topbar */}
      <header
        className="sticky top-0 z-20 px-6 py-4 border-b flex items-center justify-between"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div>
          <h1 className="text-base font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
            Gestion des employés
          </h1>
          <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
            {chargement ? '—' : `${stats.total} employés au total`}
          </p>
        </div>
        <button
          onClick={() => setModalOuverte(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--pp-accent)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-accent-hover)' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--pp-accent)' }}
        >
          <Plus size={15} strokeWidth={2} />
          Ajouter
        </button>
      </header>

      <div className="px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Total"          val={stats.total}    icone={Users}      c="#2563eb" load={chargement} />
          <Stat label="Actifs"         val={stats.actifs}   icone={UserCheck}  c="#16a34a" load={chargement} />
          <Stat label="Inactifs"       val={stats.inactifs} icone={UserX}      c="#ef4444" load={chargement} />
          <Stat label="Administrateurs"val={stats.admins}   icone={Shield}     c="#8b5cf6" load={chargement} />
        </div>

        {/* Barre recherche */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14} style={{ color: 'var(--pp-text-muted)' }} />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1) }}
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
            value={filtreStatut}
            onChange={e => { setFiltreStatut(e.target.value); setPage(1) }}
            className="px-3 py-2.5 text-sm rounded-lg border"
            style={{
              backgroundColor: 'var(--pp-input-bg)',
              borderColor: 'var(--pp-card-border)',
              color: 'var(--pp-text-primary)',
            }}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
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
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid var(--pp-divider)`, backgroundColor: 'var(--pp-page-bg)' }}>
                    {['Employé', 'Département', 'Rôle', 'Statut', 'Créé le', ''].map(col => (
                      <th key={col} className="text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--pp-text-muted)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagines.map(emp => (
                    <tr key={emp._id} style={{ borderTop: `1px solid var(--pp-divider)` }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: couleurAvatar(emp.prenom) }}>
                            {initiales(emp.prenom, emp.nom)}
                          </div>
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--pp-text-primary)' }}>
                              {emp.prenom} {emp.nom}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--pp-text-secondary)' }}>
                        {emp.departement ?? '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                          style={emp.role === 'admin'
                            ? { backgroundColor: '#8b5cf618', color: '#8b5cf6' }
                            : { backgroundColor: '#2563eb18', color: '#2563eb' }}>
                          {emp.role === 'admin' ? 'Admin' : 'Employé'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                          style={emp.statut === 'actif'
                            ? { backgroundColor: '#16a34a18', color: '#16a34a' }
                            : { backgroundColor: '#64748b18', color: '#64748b' }}>
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: emp.statut === 'actif' ? '#16a34a' : '#94a3b8' }} />
                          {emp.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm tabular-nums" style={{ color: 'var(--pp-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(emp.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setMenuOuvert(menuOuvert === emp._id ? null : emp._id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--pp-text-muted)' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                          >
                            <MoreVertical size={14} strokeWidth={2} />
                          </button>
                          {menuOuvert === emp._id && (
                            <div
                              className="absolute right-0 top-8 z-10 rounded-xl border shadow-lg py-1 w-36"
                              style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
                            >
                              <button className="flex items-center gap-2.5 w-full px-3 py-2 text-sm"
                                style={{ color: 'var(--pp-text-secondary)' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pp-nav-hover-bg)' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                                <Pencil size={13} strokeWidth={2} /> Modifier
                              </button>
                              <button
                                onClick={() => supprimer(emp._id, `${emp.prenom} ${emp.nom}`)}
                                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm"
                                style={{ color: '#ef4444' }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef444410' }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}>
                                <Trash2 size={13} strokeWidth={2} /> Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {pagines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                        Aucun employé trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t" style={{ borderColor: 'var(--pp-divider)' }}>
                  <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                    {(page - 1) * ELEMENTS_PAR_PAGE + 1}–{Math.min(page * ELEMENTS_PAR_PAGE, filtres.length)} sur {filtres.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg border disabled:opacity-30"
                      style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}>
                      <ChevronLeft size={14} strokeWidth={2} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
                        style={p === page
                          ? { backgroundColor: 'var(--pp-accent)', color: '#fff' }
                          : { border: `1px solid var(--pp-card-border)`, color: 'var(--pp-text-secondary)' }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg border disabled:opacity-30"
                      style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}>
                      <ChevronRight size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal création */}
      {modalOuverte && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setModalOuverte(false) }}>
          <div className="rounded-2xl w-full max-w-md shadow-2xl"
            style={{ backgroundColor: 'var(--pp-card-bg)', border: `1px solid var(--pp-card-border)` }}>
            <div className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: 'var(--pp-divider)' }}>
              <h2 className="text-base font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Nouvel employé
              </h2>
              <button onClick={() => setModalOuverte(false)} style={{ color: 'var(--pp-text-muted)' }}>
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={creer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {(['prenom', 'nom'] as const).map(f => (
                  <div key={f}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pp-text-primary)' }}>
                      {f === 'prenom' ? 'Prénom' : 'Nom'} *
                    </label>
                    <input type="text" required value={formulaire[f]} onChange={champ(f)}
                      className={inputCls}
                      style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }} />
                  </div>
                ))}
              </div>
              {[
                { key: 'email' as const, label: 'Email', type: 'email' },
                { key: 'password' as const, label: 'Mot de passe', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pp-text-primary)' }}>
                    {f.label} *
                  </label>
                  <input type={f.type} required value={formulaire[f.key]} onChange={champ(f.key)}
                    minLength={f.key === 'password' ? 8 : undefined}
                    className={inputCls}
                    style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }} />
                </div>
              ))}
              {[
                { key: 'departement' as const, label: 'Département', opts: [{ v: '', l: 'Sélectionner…' }, ...departements.map(d => ({ v: d, l: d }))] },
                { key: 'role' as const, label: 'Rôle', opts: [{ v: 'employe', l: 'Employé' }, { v: 'admin', l: 'Administrateur' }] },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pp-text-primary)' }}>
                    {f.label}
                  </label>
                  <select value={formulaire[f.key]} onChange={champ(f.key)}
                    className={inputCls}
                    style={{ backgroundColor: 'var(--pp-input-bg)', borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }}>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOuverte(false)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium border"
                  style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-secondary)' }}>
                  Annuler
                </button>
                <button type="submit" disabled={creation}
                  className="flex-1 py-2.5 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--pp-accent)' }}>
                  {creation ? 'Création…' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={15} strokeWidth={2} /> : <AlertCircle size={15} strokeWidth={2} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
