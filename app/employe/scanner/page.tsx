'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type TypePointage = 'entree' | 'sortie'

export default function PageScanner() {
  const [typePointage, setTypePointage] = useState<TypePointage>('entree')
  const [scannerActif, setScannerActif] = useState(false)
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [gpsOk, setGpsOk] = useState<boolean | null>(null)
  const conteneurRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null)

  // Vérification GPS
  useEffect(() => {
    if (!navigator.geolocation) { setGpsOk(false); return }
    navigator.geolocation.getCurrentPosition(
      () => setGpsOk(true),
      () => setGpsOk(false),
      { timeout: 5000 },
    )
  }, [])

  const demarrerScanner = async () => {
    if (scannerActif) return
    setScannerActif(true)
    setMessage(null)

    // Import dynamique pour éviter l'erreur SSR
    const { Html5Qrcode } = await import('html5-qrcode')

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (texte) => { validerQr(texte, scanner) },
        undefined,
      )
    } catch {
      setMessage({ type: 'erreur', texte: 'Impossible d\'accéder à la caméra' })
      setScannerActif(false)
    }
  }

  const arreterScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch { /* ignore */ }
      scannerRef.current = null
    }
    setScannerActif(false)
  }

  const validerQr = async (texte: string, scanner: { stop: () => Promise<void> }) => {
    // Arrêter immédiatement pour ne pas rescanner
    try { await scanner.stop() } catch { /* ignore */ }
    scannerRef.current = null
    setScannerActif(false)
    setEnCours(true)
    setMessage(null)

    try {
      // Le QR code doit contenir un identifiant de zone ou un token
      let latitude = 0, longitude = 0
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        )
        latitude = pos.coords.latitude
        longitude = pos.coords.longitude
      } catch { /* GPS optionnel */ }

      const res = await fetch('/api/pointages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: typePointage, latitude, longitude, qrData: texte }),
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'succes', texte: typePointage === 'entree' ? 'Entrée enregistrée avec succès !' : 'Sortie enregistrée avec succès !' })
      } else {
        setMessage({ type: 'erreur', texte: data.message ?? 'Erreur lors du pointage' })
      }
    } catch {
      setMessage({ type: 'erreur', texte: 'Erreur réseau' })
    } finally {
      setEnCours(false)
    }
  }

  useEffect(() => {
    return () => { arreterScanner() }
  }, [])

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--pt-page-bg)' }}
    >
      {/* En-tête */}
      <header
        className="sticky top-0 z-30 px-4 pt-10 pb-4 flex items-center gap-3"
        style={{ backgroundColor: 'var(--pt-sidebar-bg)' }}
      >
        <a
          href="/employe/pointage"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          onClick={() => arreterScanner()}
        >
          <ArrowLeft size={16} className="text-white" />
        </a>
        <div>
          <p className="text-white font-semibold text-base">Scanner QR Code</p>
          <p className="text-white/50 text-xs">Pointez votre caméra sur le QR Code de votre zone</p>
        </div>
      </header>

      <div className="flex-1 px-4 pt-5 space-y-4 max-w-lg mx-auto w-full">
        {/* Avertissement GPS */}
        {gpsOk === false && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#f59e0b14', color: '#f59e0b', border: '1px solid #f59e0b30' }}
          >
            <MapPin size={15} />
            GPS non disponible — le pointage sera enregistré sans localisation
          </div>
        )}

        {/* Sélecteur type */}
        <div
          className="flex rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--pt-card-border)', backgroundColor: 'var(--pt-card-bg)' }}
        >
          {(['entree', 'sortie'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypePointage(t)}
              className="flex-1 py-3 text-sm font-medium transition-colors"
              style={{
                backgroundColor: typePointage === t ? 'var(--pt-accent)' : 'transparent',
                color: typePointage === t ? '#fff' : 'var(--pt-text-secondary)',
              }}
            >
              {t === 'entree' ? 'Entrée' : 'Sortie'}
            </button>
          ))}
        </div>

        {/* Zone de scan */}
        <div
          className="rounded-2xl overflow-hidden border relative"
          style={{ backgroundColor: '#000', borderColor: 'var(--pt-card-border)', aspectRatio: '1/1', maxHeight: '340px' }}
          ref={conteneurRef}
        >
          {/* Élément ciblé par html5-qrcode */}
          <div id="qr-reader" className="w-full h-full" />

          {/* Coins décoratifs (overlay) */}
          {!scannerActif && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                {/* Coin haut-gauche */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: 'var(--pt-accent)' }} />
                {/* Coin haut-droit */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: 'var(--pt-accent)' }} />
                {/* Coin bas-gauche */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: 'var(--pt-accent)' }} />
                {/* Coin bas-droit */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: 'var(--pt-accent)' }} />
                <p className="absolute inset-0 flex items-center justify-center text-white/50 text-xs text-center px-4">
                  Appuyez sur &laquo;&nbsp;Activer&nbsp;&raquo; pour démarrer
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message retour */}
        {message && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{
              backgroundColor: message.type === 'succes' ? '#10b98114' : '#ef444414',
              color: message.type === 'succes' ? '#10b981' : '#ef4444',
              border: `1px solid ${message.type === 'succes' ? '#10b98130' : '#ef444430'}`,
            }}
          >
            {message.type === 'succes' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {message.texte}
          </div>
        )}

        {/* Bouton d'activation */}
        {enCours ? (
          <div className="flex items-center justify-center gap-2 py-4" style={{ color: 'var(--pt-accent)' }}>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm font-medium">Enregistrement du pointage…</span>
          </div>
        ) : message?.type === 'succes' ? (
          <a
            href="/employe/pointage"
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white text-center block transition-colors"
            style={{ backgroundColor: '#10b981' }}
          >
            Retour à l&apos;accueil
          </a>
        ) : scannerActif ? (
          <button
            onClick={arreterScanner}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--pt-card-bg)', color: 'var(--pt-text-primary)', border: '1px solid var(--pt-card-border)' }}
          >
            Arrêter le scanner
          </button>
        ) : (
          <button
            onClick={demarrerScanner}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--pt-accent)' }}
          >
            Activer le scanner
          </button>
        )}
      </div>
    </div>
  )
}
