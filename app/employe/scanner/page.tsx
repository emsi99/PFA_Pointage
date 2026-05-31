'use client'
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

export default function ScannerPage() {
  const [message, setMessage] = useState('')
  const [scanning, setScanning] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const startScanner = async () => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner
    setScanning(true)

    await scanner.start(
      { facingMode: 'environment' }, // use back camera
      { fps: 10, qrbox: 250 },
      async (decodedText) => {
        await scanner.stop()
        setScanning(false)
        await handleScan(decodedText)
      },
      () => {} // ignore errors while scanning
    )
  }

  const handleScan = async (qrToken: string) => {
    // Get GPS location
    navigator.geolocation.getCurrentPosition(async (position) => {
      const res = await fetch('/api/pointage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrToken,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      })
      const data = await res.json()
      setMessage(data.message)
    })
  }

  useEffect(() => {
    return () => {
      scannerRef.current?.stop()
    }
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-bold">Scanner le QR Code</h1>
      <div id="qr-reader" style={{ width: 300 }} />
      {!scanning && (
        <button
          onClick={startScanner}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg"
        >
          Lancer le scanner
        </button>
      )}
      {message && <p className="text-lg font-medium">{message}</p>}
    </div>
  )
}