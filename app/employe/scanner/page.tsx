'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { AlertCircle, CheckCircle, Clock, Loader2, QrCode } from 'lucide-react'

interface DernierPointage {
  type: 'entree' | 'sortie'
  heure: string
}

type StatutScan = 'ready' | 'initializing' | 'scanning' | 'success'

export default function ScannerPage() {
  const [dernierPointage, setDernierPointage] = useState<DernierPointage | null>(null)
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [scanStatut, setScanStatut] = useState<StatutScan>('ready')
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scanEnTraitementRef = useRef(false)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const chargerDernierPointage = async () => {
      setChargement(true)
      try {
        const res = await fetch('/api/pointages?limite=1')
        const data = await res.json()
        setDernierPointage(data.success && data.data.length ? { type: data.data[0].type, heure: data.data[0].heure } : null)
      } catch {
        setMessage({ ok: false, texte: 'Impossible de charger le dernier pointage.' })
      } finally {
        setChargement(false)
      }
    }

    chargerDernierPointage()
  }, [])

  const arreterScanner = async () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current)
      stopTimerRef.current = null
    }

    scanEnTraitementRef.current = false

    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
    }

    setScanStatut('ready')
    setEnCours(false)
  }

  const handleScan = async (qrToken: string) => {
    if (scanEnTraitementRef.current) return

    scanEnTraitementRef.current = true
    setEnCours(true)
    setMessage(null)

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      )

      const res = await fetch('/api/pointages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setDernierPointage({ type: data.data.type, heure: data.data.heure })
        setScanStatut('success')
        setMessage({
          ok: true,
          texte: data.data.type === 'entree' ? 'Entrée enregistrée ✓' : 'Sortie enregistrée ✓',
        })
        stopTimerRef.current = setTimeout(() => {
          void arreterScanner()
        }, 2000)
      } else {
        setMessage({ ok: false, texte: data.message ?? 'Erreur lors du pointage.' })
        scanEnTraitementRef.current = false
      }
    } catch {
      setMessage({ ok: false, texte: 'Autorisez la caméra et la localisation pour pointer.' })
      scanEnTraitementRef.current = false
    } finally {
      setEnCours(false)
    }
  }

  const demarrerScanner = async () => {
    setMessage(null)
    setScanStatut('initializing')

    try {
      if (!scannerRef.current) scannerRef.current = new Html5Qrcode('qr-reader')

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          void handleScan(decodedText)
        },
        () => {}
      )

      setScanStatut('scanning')
    } catch {
      setScanStatut('ready')
      setMessage({ ok: false, texte: 'Impossible de lancer la caméra.' })
    }
  }

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
      scanEnTraitementRef.current = false
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  const prochainType: 'entree' | 'sortie' = dernierPointage?.type === 'entree' ? 'sortie' : 'entree'
  const boutonPointer = prochainType === 'entree' ? 'Pointer Entrée' : 'Pointer Sortie'
  const libelleType = prochainType === 'entree' ? 'Pointage Entrée' : 'Pointage Sortie'
  const couleurAction = prochainType === 'entree' ? '#16a34a' : '#ef4444'
  const libelleStatut =
    scanStatut === 'success'
      ? 'Pointage enregistré ✓'
      : scanStatut === 'scanning'
        ? 'Scan en cours...'
        : scanStatut === 'initializing'
          ? 'Initialisation caméra...'
          : 'Prêt à pointer'

  return (
    <div className="min-h-full px-4 py-8" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <div className="mx-auto flex max-w-lg flex-col gap-4">
        <div
          className="rounded-2xl border p-5"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--pp-text-primary)' }}>
                Scanner le QR Code
              </h1>
              <p className="mt-1 text-sm" style={{ color: 'var(--pp-text-muted)' }}>
                {libelleStatut}
              </p>
            </div>
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${couleurAction}18`, color: couleurAction }}
            >
              <QrCode size={20} strokeWidth={2} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl px-3 py-2" style={{ backgroundColor: `${couleurAction}12` }}>
            <span className="text-sm font-medium" style={{ color: couleurAction }}>
              {libelleType}
            </span>
            {dernierPointage && (
              <span className="text-xs" style={{ color: 'var(--pp-text-muted)' }}>
                Dernier: {dernierPointage.type === 'entree' ? 'Entrée' : 'Sortie'} à {dernierPointage.heure}
              </span>
            )}
          </div>
        </div>

        {message && (
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
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

        <div
          className="rounded-2xl border p-4"
          style={{ backgroundColor: 'var(--pp-card-bg)', borderColor: 'var(--pp-card-border)' }}
        >
          <div
            id="qr-reader"
            className="min-h-[300px] w-full overflow-hidden rounded-xl border bg-black/5"
            style={{ borderColor: 'var(--pp-card-border)' }}
          />

          <button
            onClick={demarrerScanner}
            disabled={chargement || enCours || scanStatut === 'initializing' || scanStatut === 'scanning' || scanStatut === 'success'}
            className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl p-5 transition-opacity disabled:opacity-60"
            style={{ backgroundColor: couleurAction }}
          >
            {scanStatut === 'initializing' || enCours ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <Clock size={22} className="text-white" strokeWidth={2} />
            )}
            <span className="text-sm font-semibold text-white">
              {chargement ? 'Chargement...' : boutonPointer}
            </span>
          </button>

          {(scanStatut === 'scanning' || scanStatut === 'success') && (
            <button
              onClick={() => void arreterScanner()}
              className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-medium"
              style={{ borderColor: 'var(--pp-card-border)', color: 'var(--pp-text-primary)' }}
            >
              Stop Scanner
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
