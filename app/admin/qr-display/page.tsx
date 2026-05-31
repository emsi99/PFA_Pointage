'use client'
import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

export default function QRDisplayPage() {
  const [token, setToken] = useState<string>('')
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes in seconds

  const generateToken = async () => {
    const res = await fetch('/api/qrcode/generate')
    const data = await res.json()
    setToken(data.token)
    setTimeLeft(300)
  }

  // Generate token on mount and every 5 minutes
  useEffect(() => {
    generateToken()
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <h1 className="text-2xl font-bold">Scanner pour pointer</h1>
      {token && <QRCodeSVG value={token} size={300} />}
      <p className="text-lg">
        Expire dans: {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  )
}