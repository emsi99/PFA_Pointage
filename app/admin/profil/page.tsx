'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Briefcase, CalendarDays, IdCard, Mail, Phone, ShieldCheck, UserRound, Edit2, Save, X, Loader2 } from 'lucide-react'
import { getUser, updateUser, type Utilisateur } from '@/lib/auth-client'
import AdminHeader from '@/components/layout/AdminHeader'

function DetailProfil({ 
  label, 
  value, 
  icon: Icon,
  isEditing,
  onChange,
  name,
  type = 'text'
}: { 
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
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#8b5cf618', color: '#8b5cf6' }}>
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
            className="w-full mt-1 text-sm font-medium bg-transparent border-b border-purple-500 focus:outline-none"
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

export default function ProfilAdminPage() {
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

  const nomComplet = `${utilisateur?.prenom ?? ''} ${utilisateur?.nom ?? ''}`.trim() || 'Administrateur'
  const initiales = `${utilisateur?.prenom?.[0] ?? ''}${utilisateur?.nom?.[0] ?? 'A'}`.toUpperCase()
  const dateCreation = utilisateur?.createdAt
    ? new Date(utilisateur.createdAt).toLocaleDateString('fr-FR')
    : undefined

  if (chargement) {
    return (
      <div className="min-h-full flex items-center justify-center" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
        <Loader2 className="animate-spin" size={32} color="#8b5cf6" />
      </div>
    )
  }

  const rightActions = (
    <div className="flex gap-2 mr-2">
      {!modeEdition ? (
        <button 
          onClick={() => setModeEdition(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          style={{ color: '#8b5cf6' }}
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
            className="p-2 rounded-full hover:bg-purple-50 transition-colors text-purple-600 disabled:opacity-50"
          >
            {sauvegardeEnCours ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader 
        title="Profil administrateur"
        subtitle="Informations de votre compte"
        rightElement={rightActions}
      />

      <div className="px-6 py-6 space-y-5 max-w-4xl">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: '#8b5cf6' }}>
              {initiales}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold truncate" style={{ color: 'var(--pp-text-primary)' }}>{nomComplet}</p>
              <p className="text-sm truncate" style={{ color: 'var(--pp-text-muted)' }}>{utilisateur?.email ?? ''}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: '#8b5cf618', color: '#8b5cf6' }}>
                <ShieldCheck size={12} strokeWidth={2} />
                Administrateur
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailProfil 
            label="Prénom" 
            value={modeEdition ? formData.prenom : utilisateur?.prenom} 
            icon={UserRound} 
            isEditing={modeEdition}
            name="prenom"
            onChange={handleChange}
          />
          <DetailProfil 
            label="Nom" 
            value={modeEdition ? formData.nom : utilisateur?.nom} 
            icon={UserRound} 
            isEditing={modeEdition}
            name="nom"
            onChange={handleChange}
          />
          <DetailProfil label="Email" value={utilisateur?.email} icon={Mail} />
          <DetailProfil 
            label="Téléphone" 
            value={modeEdition ? formData.telephone : utilisateur?.telephone} 
            icon={Phone} 
            isEditing={modeEdition}
            name="telephone"
            onChange={handleChange}
          />
          <DetailProfil label="Matricule" value={utilisateur?.matricule} icon={IdCard} />
          <DetailProfil label="Poste" value={utilisateur?.poste} icon={Briefcase} />
          <DetailProfil label="Département" value={utilisateur?.departement} icon={UserRound} />
          <DetailProfil label="Statut" value={utilisateur?.statut === 'inactif' ? 'Inactif' : 'Actif'} icon={BadgeCheck} />
          <DetailProfil label="Solde congés" value={utilisateur?.soldeConges !== undefined ? `${utilisateur.soldeConges} jours` : undefined} icon={CalendarDays} />
          <DetailProfil label="Compte créé le" value={dateCreation} icon={CalendarDays} />
        </div>
      </div>
    </div>
  )
}
