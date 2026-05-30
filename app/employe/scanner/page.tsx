'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Zap, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type TypePointage = 'entree' | 'sortie'

export default function PageScanner() {
  const [type, setType] = useState<TypePointage>('entree')
  const [actif, setActif] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const [gpsOk, setGpsOk] = useState<boolean | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  useEffect(() => {
    if (!navigator.geolocation) { setGpsOk(false); return }
    navigator.geolocation.getCurrentPosition(() => setGpsOk(true), () => setGpsOk(false), { timeout: 5000 })
  }, [])

  const demarrer = async () => {
    if (actif) return
    setActif(true)
    setMessage(null)
    const { Html5Qrcode } = await import('html5-qrcode')
    const sc = new Html5Qrcode('qr-reader')
    scannerRef.current = sc
    try {
      await sc.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (texte: string) => valider(texte, sc),
        undefined,
      )
    } catch {
      setMessage({ ok: false, texte: 'Impossible d\'accéder à la caméra' })
      setActif(false)
    }
  }

  const arreter = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      scannerRef.current = null
    }
    setActif(false)
  }

  const valider = async (texte: string, sc: { stop: () => Promise<void> }) => {
    try { await sc.stop() } catch { /* ignore */ }
    scannerRef.current = null
    setActif(false)
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
        body: JSON.stringify({ type, latitude: lat, longitude: lng, qrData: texte }),
      })
      const d = await res.json()
      if (d.success) setMessage({ ok: true, texte: type === 'entree' ? 'Entrée enregistrée ✓' : 'Sortie enregistrée ✓' })
      else setMessage({ ok: false, texte: d.message ?? 'Erreur lors du pointage' })
    } catch { setMessage({ ok: false, texte: 'Erreur réseau' }) }
    finally { setEnCours(false) }
  }

  useEffect(() => () => { arreter() }, [])

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-4 pt-10 pb-4 flex items-center gap-3 border-b"
        style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
      >
        <a
          href="/employe/pointage"
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--pp-nav-hover-bg)', color: 'var(--pp-text-secondary)' }}
          onClick={() => arreter()}
        >
          <ArrowLeft size={16} strokeWidth={2} />
        </a>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
            Scanner QR Code
          </p>
          <p className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
            Placez le QR code dans le cadre
          </p>
        </div>
        <div className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: '#2563eb18', color: '#2563eb' }}>
          <Zap size={16} strokeWidth={2} />
        </div>
      </header>

      <div className="px-4 pt-5 pb-8 space-y-4 max-w-lg mx-auto">
        {/* Avertissement GPS */}
        {gpsOk === false && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#f59e0b14', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
            <MapPin size={14} strokeWidth={2} />
            GPS non disponible — pointage sans localisation
          </div>
        )}

        {/* Sélecteur Entrée / Sortie */}
        <div className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--pp-card-border)', backgroundColor: 'var(--pp-card-bg)' }}>
          {(['entree', 'sortie'] as const).map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: type === t ? 'var(--pp-accent)' : 'transparent',
                color: type === t ? '#fff' : 'var(--pp-text-secondary)',
              }}
            >
              {t === 'entree' ? 'Entrée' : 'Sortie'}
            </button>
          ))}
        </div>

        {/* Zone de scan */}
        <div
          className="rounded-2xl overflow-hidden border relative bg-black"
          style={{ borderColor: 'var(--pp-card-border)', aspectRatio: '1/1', maxHeight: '320px' }}
        >
          <div id="qr-reader" className="w-full h-full" />

          {/* Overlay coins animés */}
          {!actif && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                {[['top-0 left-0', 'border-t-2 border-l-2 rounded-tl-xl'],
                  ['top-0 right-0', 'border-t-2 border-r-2 rounded-tr-xl'],
                  ['bottom-0 left-0', 'border-b-2 border-l-2 rounded-bl-xl'],
                  ['bottom-0 right-0', 'border-b-2 border-r-2 rounded-br-xl']].map(([pos, cls]) => (
                  <div key={pos} className={`absolute ${pos} w-8 h-8 ${cls}`}
                    style={{ borderColor: 'rgba(255,255,255,0.8)' }} />
                ))}
                <p className="absolute inset-0 flex items-center justify-center text-white/50 text-xs text-center px-6">
                  Appuyez sur «&nbsp;Activer&nbsp;» pour démarrer
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Note */}
        <p className="text-xs text-center" style={{ color: 'var(--pp-text-muted)' }}>
          Assurez-vous d&apos;être dans la zone autorisée avant de pointer
        </p>

        {/* Feedback */}
        {message && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: message.ok ? '#16a34a14' : '#ef444414',
              color: message.ok ? '#16a34a' : '#ef4444',
              border: `1px solid ${message.ok ? '#16a34a30' : '#ef444430'}`,
            }}>
            {message.ok ? <CheckCircle size={14} strokeWidth={2} /> : <AlertCircle size={14} strokeWidth={2} />}
            {message.texte}
          </div>
        )}

        {/* Bouton principal */}
        {enCours ? (
          <div className="flex items-center justify-center gap-2 py-4" style={{ color: 'var(--pp-accent)' }}>
            <Loader2 size={18} strokeWidth={2} className="animate-spin" />
            <span className="text-sm font-medium">Enregistrement…</span>
          </div>
        ) : message?.ok ? (
          <a href="/employe/pointage"
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white text-center block"
            style={{ backgroundColor: '#16a34a' }}>
            Retour à l&apos;accueil
          </a>
        ) : actif ? (
          <button onClick={arreter}
            className="w-full py-3.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)', backgroundColor: 'var(--pp-card-bg)' }}>
            Arrêter le scanner
          </button>
        ) : (
          <button onClick={demarrer}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--pp-accent)' }}>
            Activer le scanner
          </button>
        )}
      </div>
    </div>
  )
}
