'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserCheck, UserX, Shield, Search, Plus,
  Trash2, ChevronLeft, ChevronRight, X, CheckCircle,
  AlertCircle, Pencil,
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
  prenom: string
  nom: string
  email: string
  password: string
  departement: string
  role: string
}

interface Toast { message: string; type: 'success' | 'error' }

const ELEMENTS_PAR_PAGE = 5

const departementsDisponibles = [
  'Informatique', 'Ressources humaines', 'Comptabilité',
  'Commercial', 'Technique', 'Direction',
]

const initiales = (prenom: string, nom: string) =>
  `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase()

const couleurAvatar = (prenom: string) => {
  const palette = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']
  return palette[prenom.charCodeAt(0) % palette.length]
}

const CarteStats = ({
  titre, valeur, icone: Icone, couleur, chargement,
}: {
  titre: string; valeur: number; icone: React.ElementType
  couleur: string; chargement: boolean
}) => (
  <div
    className="rounded-xl border p-5 flex items-center gap-4 transition-colors duration-300"
    style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
  >
    <div
      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: `${couleur}18`, color: couleur }}
    >
      <Icone size={21} />
    </div>
    <div>
      {chargement ? (
        <>
          <div className="h-6 w-10 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold" style={{ color: 'var(--pt-text-primary)' }}>{valeur}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pt-text-secondary)' }}>{titre}</p>
        </>
      )}
    </div>
  </div>
)

export default function PageEmployes() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [employes, setEmployes] = useState<Employe[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [recherche, setRecherche] = useState('')
  const [filtreRole, setFiltreRole] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')
  const [page, setPage] = useState(1)
  const [modalOuverte, setModalOuverte] = useState(false)
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
      const res = await fetch('/api/employes') // cookie envoyé automatiquement
      const data = await res.json()
      if (data.success) {
        setEmployes(data.data)
      } else {
        setErreur(data.message)
      }
    } catch {
      setErreur('Erreur lors du chargement des employés')
    } finally {
      setChargement(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const user = await getUser()
      setUtilisateur(user)
    }
    init()
    chargerEmployes()
  }, [chargerEmployes])

  const supprimerEmploye = async (id: string, nomComplet: string) => {
    if (!confirm(`Supprimer ${nomComplet} ? Cette action est irréversible.`)) return
    try {
      const res = await fetch(`/api/employes/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        afficherToast('Employé supprimé avec succès', 'success')
        chargerEmployes()
      } else {
        afficherToast(data.message, 'error')
      }
    } catch {
      afficherToast('Erreur lors de la suppression', 'error')
    }
  }

  const creerEmploye = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreation(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formulaire),
      })
      const data = await res.json()
      if (data.success) {
        afficherToast('Compte créé avec succès', 'success')
        setModalOuverte(false)
        setFormulaire({ prenom: '', nom: '', email: '', password: '', departement: '', role: 'employe' })
        chargerEmployes()
      } else {
        afficherToast(data.message, 'error')
      }
    } catch {
      afficherToast('Erreur lors de la création', 'error')
    } finally {
      setCreation(false)
    }
  }

  const champ = (key: keyof FormulaireEmploye) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setFormulaire(f => ({ ...f, [key]: e.target.value }))

  const employesFiltres = employes.filter(emp => {
    const matchRecherche =
      recherche === '' ||
      emp.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      emp.email.toLowerCase().includes(recherche.toLowerCase())
    const matchRole   = filtreRole   === '' || emp.role   === filtreRole
    const matchStatut = filtreStatut === '' || emp.statut === filtreStatut
    return matchRecherche && matchRole && matchStatut
  })

  const totalPages     = Math.ceil(employesFiltres.length / ELEMENTS_PAR_PAGE)
  const employesPagines = employesFiltres.slice((page - 1) * ELEMENTS_PAR_PAGE, page * ELEMENTS_PAR_PAGE)

  const stats = {
    total:    employes.length,
    actifs:   employes.filter(e => e.statut === 'actif').length,
    inactifs: employes.filter(e => e.statut === 'inactif').length,
    admins:   employes.filter(e => e.role   === 'admin').length,
  }

  const inputCls = 'border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#2e75b6]'

  return (
    <div className="px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pt-text-primary)' }}>
            Gestion des employés
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--pt-text-secondary)' }}>
            Gérez les comptes et les accès de votre équipe
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
          <CarteStats titre="Total employés"  valeur={stats.total}    icone={Users}      couleur="#2e75b6" chargement={chargement} />
          <CarteStats titre="Actifs"           valeur={stats.actifs}   icone={UserCheck}  couleur="#10b981" chargement={chargement} />
          <CarteStats titre="Inactifs"         valeur={stats.inactifs} icone={UserX}      couleur="#f59e0b" chargement={chargement} />
          <CarteStats titre="Administrateurs"  valeur={stats.admins}   icone={Shield}     couleur="#8b5cf6" chargement={chargement} />
        </div>

        {/* Barre d'outils */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={recherche}
              onChange={e => { setRecherche(e.target.value); setPage(1) }}
              className={`${inputCls} w-full pl-9`}
              style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }}
            />
          </div>
          <select
            value={filtreRole}
            onChange={e => { setFiltreRole(e.target.value); setPage(1) }}
            className={inputCls}
            style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }}
          >
            <option value="">Tous les rôles</option>
            <option value="employe">Employé</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filtreStatut}
            onChange={e => { setFiltreStatut(e.target.value); setPage(1) }}
            className={inputCls}
            style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }}
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
          <button
            onClick={() => setModalOuverte(true)}
            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shrink-0"
            style={{ backgroundColor: 'var(--pt-accent)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pt-accent-hover)' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--pt-accent)' }}
          >
            <Plus size={15} />
            Nouvel employé
          </button>
        </div>

        {/* Tableau */}
        <div
          className="rounded-xl border overflow-hidden transition-colors duration-300"
          style={{ backgroundColor: 'var(--pt-card-bg)', borderColor: 'var(--pt-card-border)' }}
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
          ) : erreur ? (
            <div className="flex items-center justify-center h-52 text-red-500 text-sm">{erreur}</div>
          ) : (
            <>
              <table className="w-full">
                <thead style={{ backgroundColor: 'var(--pt-muted)', borderBottom: `1px solid var(--pt-card-border)` }}>
                  <tr>
                    {['Employé', 'Département', 'Rôle', 'Statut', 'Créé le', ''].map(col => (
                      <th key={col} className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'var(--pt-text-secondary)' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employesPagines.map(emp => (
                    <tr
                      key={emp._id}
                      className="transition-colors"
                      style={{ borderTop: `1px solid var(--pt-card-border)` }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--pt-muted)' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent' }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0"
                            style={{ backgroundColor: couleurAvatar(emp.prenom) }}
                          >
                            {initiales(emp.prenom, emp.nom)}
                          </div>
                          <div>
                            <p className="font-medium text-sm" style={{ color: 'var(--pt-text-primary)' }}>
                              {emp.prenom} {emp.nom}
                            </p>
                            <p className="text-xs" style={{ color: 'var(--pt-text-secondary)' }}>{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--pt-text-secondary)' }}>
                        {emp.departement ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                          style={emp.role === 'admin'
                            ? { backgroundColor: '#8b5cf618', color: '#8b5cf6' }
                            : { backgroundColor: '#2e75b618', color: '#2e75b6' }}>
                          {emp.role === 'admin' ? 'Admin' : 'Employé'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                          style={emp.statut === 'actif'
                            ? { backgroundColor: '#10b98118', color: '#10b981' }
                            : { backgroundColor: '#ef444418', color: '#ef4444' }}>
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: emp.statut === 'actif' ? '#10b981' : '#ef4444' }} />
                          {emp.statut === 'actif' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'var(--pt-text-secondary)' }}>
                        {new Date(emp.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--pt-text-secondary)' }} title="Modifier"
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#2e75b618'; e.currentTarget.style.color = '#2e75b6' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pt-text-secondary)' }}>
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => supprimerEmploye(emp._id, `${emp.prenom} ${emp.nom}`)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--pt-text-secondary)' }} title="Supprimer"
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#ef444418'; e.currentTarget.style.color = '#ef4444' }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--pt-text-secondary)' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {employesPagines.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-sm"
                        style={{ color: 'var(--pt-text-secondary)' }}>
                        Aucun employé trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div
                  className="flex items-center justify-between px-6 py-4"
                  style={{ borderTop: `1px solid var(--pt-card-border)` }}
                >
                  <p className="text-xs" style={{ color: 'var(--pt-text-secondary)' }}>
                    {(page - 1) * ELEMENTS_PAR_PAGE + 1}–{Math.min(page * ELEMENTS_PAR_PAGE, employesFiltres.length)} sur {employesFiltres.length}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
                      style={{ borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-secondary)' }}>
                      <ChevronLeft size={15} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                        style={p === page
                          ? { backgroundColor: 'var(--pt-accent)', color: '#fff' }
                          : { border: `1px solid var(--pt-card-border)`, color: 'var(--pt-text-secondary)' }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="p-1.5 rounded-lg border transition-colors disabled:opacity-30"
                      style={{ borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-secondary)' }}>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      {/* Modal création */}
      {modalOuverte && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="rounded-2xl shadow-2xl w-full max-w-md transition-colors duration-300"
            style={{ backgroundColor: 'var(--pt-card-bg)' }}>
            <div className="flex items-center justify-between px-6 py-5"
              style={{ borderBottom: `1px solid var(--pt-card-border)` }}>
              <h2 className="text-base font-bold" style={{ color: 'var(--pt-text-primary)' }}>
                Nouvel employé
              </h2>
              <button onClick={() => setModalOuverte(false)}
                style={{ color: 'var(--pt-text-secondary)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--pt-text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--pt-text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={creerEmploye} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(['prenom', 'nom'] as const).map(f => (
                  <div key={f}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pt-text-primary)' }}>
                      {f === 'prenom' ? 'Prénom' : 'Nom'} *
                    </label>
                    <input type="text" required value={formulaire[f]} onChange={champ(f)}
                      className={`${inputCls} w-full`}
                      style={{ backgroundColor: 'var(--pt-muted)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }} />
                  </div>
                ))}
              </div>
              {([
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'password', label: 'Mot de passe', type: 'password' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pt-text-primary)' }}>
                    {f.label} *
                  </label>
                  <input type={f.type} required value={formulaire[f.key]} onChange={champ(f.key)}
                    placeholder={f.key === 'password' ? 'Minimum 8 caractères' : ''}
                    minLength={f.key === 'password' ? 8 : undefined}
                    className={`${inputCls} w-full`}
                    style={{ backgroundColor: 'var(--pt-muted)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }} />
                </div>
              ))}
              {([
                { key: 'departement', label: 'Département', options: [{ value: '', label: 'Sélectionner...' }, ...departementsDisponibles.map(d => ({ value: d, label: d }))] },
                { key: 'role', label: 'Rôle', options: [{ value: 'employe', label: 'Employé' }, { value: 'admin', label: 'Administrateur' }] },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--pt-text-primary)' }}>
                    {f.label}
                  </label>
                  <select value={formulaire[f.key]} onChange={champ(f.key)}
                    className={`${inputCls} w-full`}
                    style={{ backgroundColor: 'var(--pt-muted)', borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-primary)' }}>
                    {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOuverte(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border"
                  style={{ borderColor: 'var(--pt-card-border)', color: 'var(--pt-text-secondary)' }}>
                  Annuler
                </button>
                <button type="submit" disabled={creation}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--pt-accent)' }}>
                  {creation ? 'Création...' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium z-50
          ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  )
}
