'use client'

import { useEffect, useState } from 'react'
import { Briefcase, CalendarDays, IdCard, Mail, Phone, Shield, UserRound, Edit2, Save, X, Loader2, LogOut } from 'lucide-react'

import { getUser, logout, updateUser, type Utilisateur } from '@/lib/auth-client'

function ChampProfil({ label, value, icon: Icon, isEditing, onChange, name, type = 'text' }: { 
  label: string; 
  value?: string | number; 
  icon: React.ElementType;
  isEditing?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name?: string;
  type?: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 flex items-start gap-3 transition-all"
      style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#2563eb18', color: '#2563eb' }}>
        <Icon size={16} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>{label}</p>
        {isEditing && onChange ? (
          <input
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            className="w-full mt-1 text-sm font-medium bg-transparent border-b border-blue-500 focus:outline-none"
            style={{ color: 'var(--pp-text-primary)' }}
          />
        ) : (
          <p className="text-sm font-medium truncate" style={{ color: 'var(--pp-text-primary)' }}>
            {value || 'Non renseigné'}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ProfilEmployePage() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(true)
  const [modeEdition, setModeEdition] = useState(false)
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false)
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    telephone: ''
  })

  useEffect(() => {
    getUser().then(user => {
      if (!user) {
        window.location.replace('/login')
        return
      }
      setUtilisateur(user)
      setFormData({
        nom: user.nom || '',
        prenom: user.prenom || '',
        telephone: user.telephone || ''
      })
      setChargement(false)
    })
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const annulerEdition = () => {
    if (utilisateur) {
      setFormData({
        nom: utilisateur.nom || '',
        prenom: utilisateur.prenom || '',
        telephone: utilisateur.telephone || ''
      })
    }
    setModeEdition(false)
  }

  const enregistrer = async () => {
    setSauvegardeEnCours(true)
    const updatedUser = await updateUser(formData)
    if (updatedUser) {
      setUtilisateur(updatedUser)
      setModeEdition(false)
    }
    setSauvegardeEnCours(false)
  }

  const deconnecter = async () => {
    await logout()
    window.location.replace('/login')
  }

  const nomComplet = `${utilisateur?.prenom ?? ''} ${utilisateur?.nom ?? ''}`.trim() || 'Employé'
  const initiales = `${utilisateur?.prenom?.[0] ?? ''}${utilisateur?.nom?.[0] ?? 'E'}`.toUpperCase()

  if (chargement) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
        <Loader2 className="animate-spin" size={32} color="var(--pp-accent)" />
      </div>
    )
  }

  return (
    <div className="min-h-full px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pp-text-primary)' }}>Mon Profil</h1>
          <p className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>Gérez vos informations personnelles</p>
        </div>
        {!modeEdition ? (
          <button 
            onClick={() => setModeEdition(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white dark:bg-white/5 border shadow-sm"
            style={{ color: 'var(--pp-accent)', borderColor: 'var(--pp-card-border)' }}
          >
            <Edit2 size={18} />
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={annulerEdition}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-white dark:bg-white/5 border shadow-sm text-gray-500"
              style={{ borderColor: 'var(--pp-card-border)' }}
            >
              <X size={18} />
            </button>
            <button 
              onClick={enregistrer}
              disabled={sauvegardeEnCours}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-blue-600 text-white shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {sauvegardeEnCours ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </button>
          </div>
        )}
      </header>

      <div
        className="rounded-3xl border p-6 shadow-sm"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg" 
               style={{ backgroundColor: 'var(--pp-accent)', boxShadow: '0 10px 20px -5px var(--pp-accent)' }}>
            {initiales}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold truncate" style={{ color: 'var(--pp-text-primary)' }}>{nomComplet}</p>
            <p className="text-sm font-medium" style={{ color: 'var(--pp-text-muted)' }}>{utilisateur?.email ?? ''}</p>
            <div className="mt-3 flex">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider" 
                    style={{ backgroundColor: '#2563eb12', color: '#2563eb', border: '1px solid #2563eb20' }}>
                <Shield size={12} strokeWidth={2.5} />
                Employé
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <ChampProfil 
            label="Prénom" 
            value={modeEdition ? formData.prenom : utilisateur?.prenom} 
            icon={UserRound} 
            isEditing={modeEdition}
            name="prenom"
            onChange={handleChange}
          />
          <ChampProfil 
            label="Nom" 
            value={modeEdition ? formData.nom : utilisateur?.nom} 
            icon={UserRound} 
            isEditing={modeEdition}
            name="nom"
            onChange={handleChange}
          />
        </div>
        
        <ChampProfil 
          label="Email" 
          value={utilisateur?.email} 
          icon={Mail} 
        />
        <ChampProfil 
          label="Téléphone" 
          value={modeEdition ? formData.telephone : utilisateur?.telephone} 
          icon={Phone} 
          isEditing={modeEdition}
          name="telephone"
          onChange={handleChange}
        />
        
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-3xl border p-4" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
             <div className="flex items-center gap-2 mb-2">
               <IdCard size={14} className="text-blue-500" />
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Matricule</p>
             </div>
             <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>{utilisateur?.matricule || '—'}</p>
          </div>
          <div className="rounded-3xl border p-4" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
             <div className="flex items-center gap-2 mb-2">
               <Briefcase size={14} className="text-amber-500" />
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Poste</p>
             </div>
             <p className="text-sm font-bold truncate" style={{ color: 'var(--pp-text-primary)' }}>{utilisateur?.poste || '—'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-3xl border p-4" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
             <div className="flex items-center gap-2 mb-2">
               <UserRound size={14} className="text-purple-500" />
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Département</p>
             </div>
             <p className="text-sm font-bold truncate" style={{ color: 'var(--pp-text-primary)' }}>{utilisateur?.departement || '—'}</p>
          </div>
          <div className="rounded-3xl border p-4" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
             <div className="flex items-center gap-2 mb-2">
               <CalendarDays size={14} className="text-emerald-500" />
               <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Solde Congés</p>
             </div>
             <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>{utilisateur?.soldeConges ?? 0} jours</p>
          </div>
        </div>
      </div>

      {!modeEdition && (
        <button
          onClick={deconnecter}
          className="w-full rounded-3xl p-4 flex items-center justify-center gap-2 text-sm font-bold text-white mt-4 shadow-lg shadow-red-500/20 transition-transform active:scale-95"
          style={{ backgroundColor: '#ef4444' }}
        >
          <LogOut size={18} strokeWidth={2.5} />
          DÉCONNEXION
        </button>
      )}
    </div>
  )
}
