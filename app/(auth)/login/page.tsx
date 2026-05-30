'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Lock } from 'lucide-react'
import Logo from '@/components/Logo'

export default function PageLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const [voirMdp, setVoirMdp] = useState(false)

  const seConnecter = async (e: React.FormEvent) => {
    e.preventDefault()
    setChargement(true)
    setErreur('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!data.success) { setErreur(data.message); return }
      if (data.utilisateur.role === 'admin') router.push('/admin/dashboard')
      else router.push('/employe/pointage')
    } catch {
      setErreur('Erreur de connexion au serveur')
    } finally {
      setChargement(false)
    }
  }

  const inputCls = `
    w-full h-11 text-sm rounded-xl border px-10
    focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40
    transition-colors
  `

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#0a0e16' }}
    >
      {/* Halo bas-gauche */}
      <div className="absolute bottom-[-140px] left-[-120px] w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 70%)' }} />
      {/* Halo haut-droit */}
      <div className="absolute top-[-80px] right-[-60px] w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />
      {/* Grille de points */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Card */}
        <div className="rounded-[18px] overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#ffffff', border: '1px solid rgba(255,255,255,0.08)' }}>

          {/* Header card */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <div className="flex justify-center mb-5">
              <Logo />
            </div>
            <h1 className="text-[17px] font-semibold text-[#0f1729] text-center leading-snug">
              Bon retour 👋
            </h1>
            <p className="text-sm text-[#64748b] text-center mt-1">
              Connectez-vous à votre espace
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={seConnecter} className="px-8 py-6 space-y-4">
            {erreur && (
              <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">
                <AlertCircle size={14} strokeWidth={2} className="shrink-0" />
                {erreur}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#0f1729] mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className={inputCls}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    color: '#0f1729',
                    paddingLeft: '2.5rem',
                    paddingRight: '1rem',
                  }}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-medium text-[#0f1729] mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock size={14} strokeWidth={2} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={voirMdp ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className={inputCls}
                  style={{
                    backgroundColor: '#f8fafc',
                    borderColor: '#e2e8f0',
                    color: '#0f1729',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem',
                  }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setVoirMdp(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {voirMdp ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                </button>
              </div>
            </div>

            <div className="text-right -mt-1">
              <a href="#" className="text-xs text-[#2563eb] hover:underline underline-offset-2">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              type="submit"
              disabled={chargement}
              className="w-full h-11 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              style={{ backgroundColor: chargement ? '#1d4ed8' : '#2563eb' }}
              onMouseEnter={e => { if (!chargement) e.currentTarget.style.backgroundColor = '#1d4ed8' }}
              onMouseLeave={e => { if (!chargement) e.currentTarget.style.backgroundColor = '#2563eb' }}
            >
              {chargement
                ? <><Loader2 size={15} strokeWidth={2} className="animate-spin" /> Connexion…</>
                : <>Se connecter <ArrowRight size={14} strokeWidth={2} /></>
              }
            </button>
          </form>

          {/* Footer card */}
          <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-1.5">
            <Lock size={11} strokeWidth={2} className="text-slate-400" />
            <span className="text-[11px] text-slate-400">
              Accès réservé au personnel autorisé
            </span>
          </div>
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Problème de connexion ? Contactez votre administrateur RH
        </p>
      </div>
    </div>
  )
}
