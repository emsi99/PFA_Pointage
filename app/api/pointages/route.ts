import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import QRToken from '@/models/QRToken'
import Pointage from '@/models/Pointage'

type PointageType = 'entree' | 'sortie'

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function isValidCoordinate(latitude: unknown, longitude: unknown) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token ? verifyToken(token) : null
}

function formatPointageDate(date: Date) {
  return {
    date: date.toISOString().split('T')[0],
    heure: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  }
}

export async function GET(req: NextRequest) {
  await connectDB()

  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  const limiteParam = req.nextUrl.searchParams.get('limite')
  const limite = Math.min(Math.max(Number(limiteParam) || 50, 1), 100)
  const filtre = user.role === 'admin' ? {} : { user_id: user.id }

  const pointages = await Pointage.find(filtre)
    .sort({ createdAt: -1 })
    .limit(limite)

  return NextResponse.json({ success: true, data: pointages })
}

export async function POST(req: NextRequest) {
  await connectDB()

  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  const { qrToken, latitude, longitude, type: requestedType } = await req.json()

  if (!isValidCoordinate(latitude, longitude)) {
    return NextResponse.json({ success: false, message: 'Position GPS invalide' }, { status: 400 })
  }

  let valide = false
  let anomalie: string | undefined

  if (qrToken) {
    const qr = await QRToken.findOne({ token: qrToken })
    if (!qr || qr.expiresAt < new Date()) {
      return NextResponse.json({ success: false, message: 'QR Code invalide ou expiré' }, { status: 400 })
    }

    const distance = distanceMeters(latitude, longitude, qr.latitude, qr.longitude)
    if (distance > qr.radiusMeters) {
      return NextResponse.json(
        { success: false, message: 'Vous êtes hors zone autorisée' },
        { status: 400 }
      )
    }

    valide = true
  }

  const lastPointage = await Pointage.findOne({ user_id: user.id }).sort({ createdAt: -1 })
  const type: PointageType = qrToken
    ? !lastPointage || lastPointage.type === 'sortie' ? 'entree' : 'sortie'
    : requestedType === 'sortie' ? 'sortie' : 'entree'
  const now = new Date()
  const formatted = formatPointageDate(now)

  if (!qrToken) {
    anomalie = 'Pointage sans QR Code'
  }

  const pointage = await Pointage.create({
    user_id: user.id,
    type,
    latitude,
    longitude,
    date: formatted.date,
    heure: formatted.heure,
    valide,
    anomalie,
  })

  return NextResponse.json({
    success: true,
    message: `Pointage ${type} enregistré !`,
    data: pointage,
  })
}
