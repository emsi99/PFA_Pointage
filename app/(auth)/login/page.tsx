'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Fingerprint, ShieldCheck, Lock, Mail,
  Eye, EyeOff, ArrowRight, AlertCircle, Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function PageLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.message)
        return
      }

      // Le token est dans le cookie httpOnly — pas de localStorage
      // On utilise seulement le rôle retourné dans le body pour rediriger
      const { utilisateur } = data

      if (utilisateur.role === 'admin') {
        router.push('/admin/dashboard')
      } else {
        router.push('/employe/pointage')
      }
    } catch {
      setError('Erreur de connexion au serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0a1f3d] relative overflow-hidden min-h-screen flex flex-col items-center justify-center">
      {/* Halo bas-gauche */}
      <div
        className="absolute bottom-[-120px] left-[-100px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(46,117,182,0.35) 0%, transparent 70%)' }}
      />
      {/* Halo haut-droit */}
      <div
        className="absolute top-[-60px] right-[-40px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(46,117,182,0.18) 0%, transparent 70%)' }}
      />
      {/* Grille de points */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px] mx-auto px-4">
        {/* Barre du haut */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="bg-[#2e75b6] rounded-lg w-8 h-8 flex items-center justify-center shrink-0">
              <Fingerprint size={16} className="text-white" />
            </div>
            <span className="text-white text-sm font-medium">PointApp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-white/40" />
            <span className="text-white/40 text-xs">Connexion sécurisée</span>
          </div>
        </div>

        <Card className={cn('rounded-2xl border border-slate-200 bg-white shadow-2xl gap-0 py-0 ring-0')}>
          <CardHeader className="bg-[#0f2a52] rounded-t-2xl px-7 py-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-white text-lg font-medium leading-snug">Bonjour, bon retour.</p>
                <p className="text-white/45 text-xs mt-1.5 leading-relaxed">
                  Identifiez-vous pour accéder à votre espace
                </p>
              </div>
              <div className="bg-white/[0.08] rounded-lg p-2 shrink-0 mt-0.5">
                <Lock size={16} className="text-white/60" />
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleLogin}>
            <CardContent className="px-7 py-5 space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle size={14} />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="pl-9 h-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="pr-10 h-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-[#2e75b6] text-xs hover:underline underline-offset-2">
                  Mot de passe oublié ?
                </a>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full h-10 bg-[#2e75b6] hover:bg-[#1d5fa0] text-white border-transparent transition-colors duration-150"
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" />Connexion en cours...</>
                ) : (
                  <>Se connecter<ArrowRight size={14} /></>
                )}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="px-7 py-3 justify-center bg-transparent border-t border-slate-100">
            <Lock size={11} className="text-slate-400 shrink-0" />
            <span className="text-slate-400 text-xs ml-1.5">
              Accès réservé au personnel autorisé · Entreprise XYZ
            </span>
          </CardFooter>
        </Card>

        <p className="text-white/30 text-xs text-center mt-4">
          Problème de connexion ? Contactez votre administrateur RH
        </p>
      </div>
    </div>
  )
}
