'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Clock, MapPin, CheckCircle, AlertCircle, Loader2, QrCode, Calendar, ChevronRight } from 'lucide-react'
import { getUser, logout, type Utilisateur } from '@/lib/auth-client'

interface DernierPointage { type: 'entree' | 'sortie'; heure: string }

export default function PageAccueilEmploye() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(true)
  const [dernierPointage, setDernierPointage] = useState<DernierPointage | null>(null)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [heure, setHeure] = useState('')

  // Horloge live
  useEffect(() => {
    const maj = () => setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    maj()
    const id = setInterval(maj, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const init = async () => {
      setChargement(true)
      try {
        const [user, resP] = await Promise.all([getUser(), fetch('/api/pointages?limite=1')])
        if (!user) { window.location.replace('/login'); return }
        setUtilisateur(user)
        const d = await resP.json()
        if (d.success && d.data.length) setDernierPointage({ type: d.data[0].type, heure: d.data[0].heure })
      } catch { /* ignore */ }
      finally { setChargement(false) }
    }
    init()
  }, [])

  const pointer = async (type: 'entree' | 'sortie') => {
    setEnCours(true)
    setMessage(null)
    try {
      let lat = 0, lng = 0
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        )
        lat = pos.coords.latitude; lng = pos.coords.longitude
      } catch { /* GPS optionnel */ }
      const res = await fetch('/api/pointages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, latitude: lat, longitude: lng }),
      })
      const d = await res.json()
      if (d.success) {
        setDernierPointage({ type: d.data.type, heure: d.data.heure })
        setMessage({ ok: true, texte: type === 'entree' ? 'Entrée enregistrée ✓' : 'Sortie enregistrée ✓' })
      } else {
        setMessage({ ok: false, texte: d.message ?? 'Erreur lors du pointage' })
      }
    } catch { setMessage({ ok: false, texte: 'Erreur réseau' }) }
    finally { setEnCours(false) }
  }

  const deconnecter = async () => { await logout(); window.location.replace('/login') }

  const deja = dernierPointage?.type === 'entree'
  const prenom = utilisateur?.prenom ?? utilisateur?.nom ?? 'vous'
  const initiale = (utilisateur?.prenom ?? utilisateur?.nom ?? 'E')[0].toUpperCase()

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 pt-10 pb-4 flex items-center justify-between"
        style={{ backgroundColor: 'var(--pp-sidebar-bg)', borderBottom: '1px solid var(--pp-sidebar-border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: 'var(--pp-accent)' }}
          >
            {initiale}
          </div>
          <div>
            {chargement
              ? <div className="space-y-1.5"><div className="h-3.5 w-28 rounded animate-pulse" style={{ backgroundColor: 'var(--pp-nav-hover-bg)' }} /><div className="h-3 w-16 rounded animate-pulse" style={{ backgroundColor: 'var(--pp-nav-hover-bg)' }} /></div>
              : <>
                  <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                    Bonjour 👋 {prenom}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>Employé</p>
                </>
            }
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--pp-nav-hover-bg)', color: 'var(--pp-text-secondary)' }}>
            <Bell size={16} strokeWidth={2} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button onClick={deconnecter}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-white"
            style={{ backgroundColor: 'var(--pp-accent)' }}>
            Quit
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 pb-8 space-y-4 max-w-lg mx-auto">
        {/* Carte statut + horloge */}
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          {/* Pill statut */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: deja ? '#16a34a18' : '#64748b18',
                color: deja ? '#16a34a' : '#64748b',
              }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: deja ? '#16a34a' : '#94a3b8' }} />
              {deja ? 'Pointé' : 'Non pointé'}
            </div>
            {dernierPointage && (
              <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                {dernierPointage.type === 'entree' ? 'Entrée' : 'Sortie'} à {dernierPointage.heure}
              </p>
            )}
          </div>

          {/* Horloge */}
          <p
            className="text-[44px] font-bold leading-none tabular-nums"
            style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {heure || '--:--'}
          </p>
          <p className="text-xs mt-1 font-medium" style={{ color: 'var(--pp-text-secondary)' }}>
            {deja ? 'Entrée' : 'Prêt à pointer'}
          </p>

          {/* Localisation */}
          <div className="flex items-center gap-1.5 mt-3">
            <MapPin size={12} strokeWidth={2} style={{ color: 'var(--pp-text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
              Bamako, Mali · <span style={{ color: '#16a34a' }}>Dans la zone autorisée</span>
            </span>
          </div>
        </div>

        {/* Feedback */}
        {message && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: message.ok ? '#16a34a14' : '#ef444414',
              color: message.ok ? '#16a34a' : '#ef4444',
              border: `1px solid ${message.ok ? '#16a34a30' : '#ef444430'}`,
            }}
          >
            {message.ok ? <CheckCircle size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={2} />}
            {message.texte}
          </div>
        )}

        {/* Boutons de pointage */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => pointer('entree')}
            disabled={enCours || deja}
            className="rounded-2xl p-5 flex flex-col items-center gap-3 transition-opacity"
            style={{ backgroundColor: '#16a34a', opacity: deja ? 0.35 : 1 }}
          >
            {enCours && !deja ? <Loader2 size={26} className="text-white animate-spin" /> : <Clock size={26} className="text-white" strokeWidth={2} />}
            <span className="text-white font-semibold text-sm">Pointer Entrée</span>
          </button>

          <button
            onClick={() => pointer('sortie')}
            disabled={enCours || !deja}
            className="rounded-2xl p-5 flex flex-col items-center gap-3 transition-opacity"
            style={{ backgroundColor: '#f59e0b', opacity: !deja ? 0.35 : 1 }}
          >
            {enCours && deja ? <Loader2 size={26} className="text-white animate-spin" /> : <Clock size={26} className="text-white" strokeWidth={2} />}
            <span className="text-white font-semibold text-sm">Pointer Sortie</span>
          </button>
        </div>

        {/* Scanner QR */}
        <a
          href="/employe/scanner"
          className="rounded-2xl border p-4 flex items-center gap-4"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#2563eb18', color: '#2563eb' }}
          >
            <QrCode size={20} strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
              Scanner un QR Code
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pp-text-muted)' }}>
              Pointer via le QR code de votre zone
            </p>
          </div>
          <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--pp-text-muted)' }} />
        </a>

        {/* Mes demandes de congé */}
        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={15} strokeWidth={2} style={{ color: '#8b5cf6' }} />
              <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Mes demandes de congé
              </p>
            </div>
            <a href="/employe/conges"
              className="text-xs font-medium"
              style={{ color: 'var(--pp-accent)' }}>
              Voir tout
            </a>
          </div>
          <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
            Aucune demande en cours
          </p>
        </div>
      </div>
    </div>
  )
}
