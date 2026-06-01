'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Briefcase, CalendarDays, IdCard, LogOut, Mail, Phone, Shield, UserRound, Edit2, Save, X, Loader2 } from 'lucide-react'
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
    <div className="min-h-full px-4 py-6" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <div className="mx-auto max-w-lg space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold" style={{ color: 'var(--pp-text-primary)' }}>Profil</h1>
            <p className="text-sm" style={{ color: 'var(--pp-text-muted)' }}>Informations de votre compte</p>
          </div>
          {!modeEdition ? (
            <button 
              onClick={() => setModeEdition(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              style={{ color: 'var(--pp-accent)' }}
            >
              <Edit2 size={20} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button 
                onClick={annulerEdition}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500"
              >
                <X size={20} />
              </button>
              <button 
                onClick={enregistrer}
                disabled={sauvegardeEnCours}
                className="p-2 rounded-full hover:bg-blue-50 transition-colors text-blue-600 disabled:opacity-50"
              >
                {sauvegardeEnCours ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              </button>
            </div>
          )}
        </header>

        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: 'var(--pp-accent)' }}>
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold truncate" style={{ color: 'var(--pp-text-primary)' }}>{nomComplet}</p>
              <p className="text-sm truncate" style={{ color: 'var(--pp-text-muted)' }}>{utilisateur?.email ?? ''}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: '#2563eb18', color: '#2563eb' }}>
                <Shield size={12} strokeWidth={2} />
                Employé
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
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
          <ChampProfil label="Matricule" value={utilisateur?.matricule} icon={IdCard} />
          <ChampProfil label="Poste" value={utilisateur?.poste} icon={Briefcase} />
          <ChampProfil label="Département" value={utilisateur?.departement} icon={UserRound} />
          <ChampProfil label="Solde congés" value={utilisateur?.soldeConges !== undefined ? `${utilisateur.soldeConges} jours` : undefined} icon={CalendarDays} />
          <ChampProfil label="Statut" value={utilisateur?.statut === 'inactif' ? 'Inactif' : 'Actif'} icon={BadgeCheck} />
        </div>

        {!modeEdition && (
          <button
            onClick={deconnecter}
            className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-white mt-4"
            style={{ backgroundColor: '#ef4444' }}
          >
            <LogOut size={16} strokeWidth={2} />
            Déconnexion
          </button>
        )}
      </div>
    </div>
  )
}
