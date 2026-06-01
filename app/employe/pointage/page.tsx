'use client'

import { useState, useEffect } from 'react'
import { Clock, MapPin, CheckCircle, AlertCircle, QrCode, Calendar, ChevronRight } from 'lucide-react'
import { getUser, type Utilisateur } from '@/lib/auth-client'

interface DernierPointage { type: 'entree' | 'sortie'; heure: string }

export default function PageAccueilEmploye() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [dernierPointage, setDernierPointage] = useState<DernierPointage | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [heure, setHeure] = useState('')

  useEffect(() => {
    const maj = () => setHeure(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    maj()
    const id = setInterval(maj, 10000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const init = async () => {
      try {
        const [user, resP] = await Promise.all([getUser(), fetch('/api/pointages?limite=1')])
        if (!user) { window.location.replace('/login'); return }
        setUtilisateur(user)
        const d = await resP.json()
        if (d.success && d.data.length) setDernierPointage({ type: d.data[0].type, heure: d.data[0].heure })
      } catch { /* ignore */ }
    }
    init()
  }, [])

  const deja = dernierPointage?.type === 'entree'
  const prenom = utilisateur?.prenom ?? utilisateur?.nom ?? 'vous'
  const dateAujourdhui = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-full px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      {/* Professional Greeting */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--pp-text-primary)' }}>
          Tableau de bord
        </h1>
        <p className="text-sm font-medium" style={{ color: 'var(--pp-text-muted)' }}>
          {dateAujourdhui.charAt(0).toUpperCase() + dateAujourdhui.slice(1)}
        </p>
      </div>

      {/* Main Status Card */}
      <div
        className="rounded-3xl border p-6 shadow-sm overflow-hidden relative"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest"
            style={{
              backgroundColor: deja ? '#16a34a12' : '#64748b12',
              color: deja ? '#16a34a' : '#64748b',
              border: `1px solid ${deja ? '#16a34a20' : '#64748b20'}`
            }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: deja ? '#16a34a' : '#94a3b8' }} />
            {deja ? 'Session active' : 'Non pointé'}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--pp-text-muted)' }}>
            <MapPin size={12} strokeWidth={2.5} className="text-blue-500" />
            <span>Casablanca, Maroc</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-2">
          <p
            className="text-6xl font-black leading-none tabular-nums tracking-tighter"
            style={{ color: 'var(--pp-text-primary)', fontFamily: 'var(--font-mono)' }}
          >
            {heure || '--:--'}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Arrivée</p>
              <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>
                {dernierPointage?.type === 'entree' ? dernierPointage.heure : '--:--'}
              </p>
            </div>
            <div className="w-px h-8 bg-gray-100 dark:bg-white/10" />
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Départ</p>
              <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>
                {dernierPointage?.type === 'sortie' ? dernierPointage.heure : '--:--'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center">
          <a
            href="/employe/scanner"
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 font-bold text-sm shadow-lg shadow-blue-500/20"
            style={{ backgroundColor: 'var(--pp-accent)', color: '#fff' }}
          >
            <QrCode size={20} strokeWidth={2.5} />
            {deja ? 'POINTER LA SORTIE' : 'POINTER L\'ARRIVÉE'}
          </a>
        </div>
      </div>

      {/* Stats Quick Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 text-blue-600">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Heures / Semaine</p>
          <p className="text-xl font-black" style={{ color: 'var(--pp-text-primary)' }}>38.5h</p>
        </div>
        <div className="rounded-3xl border p-5" style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-600">
            <CheckCircle size={20} strokeWidth={2.5} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Présence</p>
          <p className="text-xl font-black" style={{ color: 'var(--pp-text-primary)' }}>98%</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-widest px-1" style={{ color: 'var(--pp-text-muted)' }}>
          Accès rapide
        </p>
        
        <a
          href="/employe/historique"
          className="rounded-3xl border p-4 flex items-center gap-4 transition-all active:scale-98 bg-white dark:bg-white/5"
          style={{ borderColor: 'var(--pp-card-border)' }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>Historique complet</p>
            <p className="text-xs font-medium text-gray-400">Consultez vos pointages passés</p>
          </div>
          <ChevronRight size={18} strokeWidth={2.5} className="text-gray-300" />
        </a>

        <a
          href="/employe/conges"
          className="rounded-3xl border p-4 flex items-center gap-4 transition-all active:scale-98 bg-white dark:bg-white/5"
          style={{ borderColor: 'var(--pp-card-border)' }}
        >
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-gray-50 dark:bg-white/5 text-purple-500">
            <Calendar size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--pp-text-primary)' }}>Demande de congés</p>
            <p className="text-xs font-medium text-gray-400">Gérez vos absences</p>
          </div>
          <ChevronRight size={18} strokeWidth={2.5} className="text-gray-300" />
        </a>
      </div>

      {message && (
        <div
          className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold shadow-2xl animate-in slide-in-from-bottom-5 duration-500"
          style={{
            backgroundColor: message.ok ? '#10b981' : '#ef4444',
            color: '#fff',
          }}
        >
          {message.ok ? <CheckCircle size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
          {message.texte}
        </div>
      )}
    </div>
  )
}
