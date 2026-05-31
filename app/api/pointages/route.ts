import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import QRToken from '@/models/QRToken'
import Pointage from '@/models/Pointage'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const ZONE = {
  latitude: 33.5731,   // ← replace with your office GPS coords
  longitude: -7.5898,
  radius: 100          // meters
}

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export async function POST(req: NextRequest) {
  await connectDB()

  const { qrToken, latitude, longitude } = await req.json()

  // 1. Check QR token
  const qr = await QRToken.findOne({ token: qrToken })
  if (!qr || qr.expiresAt < new Date()) {
    return NextResponse.json({ success: false, message: 'QR Code invalide ou expiré' }, { status: 400 })
  }

  // 2. Check GPS
  const distance = distanceMeters(latitude, longitude, ZONE.latitude, ZONE.longitude)
  if (distance > ZONE.radius) {
    return NextResponse.json({ success: false, message: 'Vous êtes hors zone autorisée' }, { status: 400 })
  }

  // 3. Get user from JWT
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET)
  const { payload } = await jwtVerify(token, secret) as { payload: { id: string; role: string } }

  // 4. Determine entree or sortie
  const lastPointage = await Pointage.findOne({ userId: payload.id }).sort({ createdAt: -1 })
  const type = !lastPointage || lastPointage.type === 'sortie' ? 'entree' : 'sortie'

  // 5. Save pointage
  await Pointage.create({
    userId: payload.id,
    type,
    latitude,
    longitude,
    date: new Date(),
  })

  return NextResponse.json({ success: true, message: `Pointage ${type} enregistré !` })
}