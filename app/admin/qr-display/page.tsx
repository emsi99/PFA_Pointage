'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import AdminHeader from '@/components/layout/AdminHeader'

export default function QRDisplayPage() {
  const [token, setToken] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const generateToken = async () => {
    setLoading(true)
    setMessage('')

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      )

      const res = await fetch('/api/qrcode/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setMessage(data.message ?? 'Erreur lors de la génération du QR Code')
        return
      }

      setToken(data.token)
      setTimeLeft(300)
    } catch {
      setMessage('Autorisez la localisation pour générer un QR Code.')
    } finally {
      setLoading(false)
    }
  }

  // Generate token on mount and every 5 minutes
  useEffect(() => {
    const init = async () => {
      await generateToken()
    }
    init()
    const interval = setInterval(generateToken, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="min-h-full" style={{ backgroundColor: 'var(--pp-page-bg)' }}>
      <AdminHeader 
        title="QR Code de pointage"
        subtitle="Générez un code pour les employés"
      />
      
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--pp-text-primary)' }}>Scanner pour pointer</h2>
        <div className="bg-white p-6 rounded-2xl shadow-sm border" style={{ borderColor: 'var(--pp-card-border)' }}>
          {token && <QRCodeSVG value={token} size={300} />}
          {loading && !token && <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">Génération...</div>}
        </div>
        
        {message && <p className="text-lg font-medium text-red-600">{message}</p>}
        
        <div className="text-center">
          <p className="text-lg" style={{ color: 'var(--pp-text-primary)' }}>
            Expire dans: <span className="font-mono font-bold text-[#2563eb]">{minutes}:{seconds.toString().padStart(2, '0')}</span>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--pp-text-muted)' }}>Le code se régénère automatiquement</p>
        </div>

        <button
          onClick={generateToken}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
        >
          {loading ? 'Génération...' : 'Régénérer maintenant'}
        </button>
      </div>
    </div>
  )
}
