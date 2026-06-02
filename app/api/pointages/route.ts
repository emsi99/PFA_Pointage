import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import QRToken from '@/models/QRToken'
import Pointage from '@/models/Pointage'
import User from '@/models/User'

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

  const params = req.nextUrl.searchParams
  const limiteParam = params.get('limite')
  const limite = Math.min(Math.max(Number(limiteParam) || 50, 1), 500)
  const filtre: Record<string, unknown> = user.role === 'admin' ? {} : { user_id: user.id }

  if (user.role === 'admin') {
    const userId = params.get('userId')
    const type = params.get('type')
    const valide = params.get('valide')
    const dateDebut = params.get('dateDebut')
    const dateFin = params.get('dateFin')
    const recherche = params.get('recherche')?.trim()

    if (userId) filtre.user_id = userId
    if (type === 'entree' || type === 'sortie') filtre.type = type
    if (valide === 'true' || valide === 'false') filtre.valide = valide === 'true'
    if (dateDebut || dateFin) {
      filtre.date = {
        ...(dateDebut ? { $gte: dateDebut } : {}),
        ...(dateFin ? { $lte: dateFin } : {}),
      }
    }
    if (recherche) {
      const utilisateurs = await User.find(
        {
          $or: [
            { nom: { $regex: recherche, $options: 'i' } },
            { prenom: { $regex: recherche, $options: 'i' } },
            { email: { $regex: recherche, $options: 'i' } },
            { departement: { $regex: recherche, $options: 'i' } },
          ],
        },
        { _id: 1 }
      )
      const ids = utilisateurs.map(u => u._id)
      filtre.user_id = userId
        ? { $in: ids.filter(id => id.toString() === userId) }
        : { $in: ids }
    }
  }

  const requete = Pointage.find(filtre)
    .sort({ createdAt: -1 })
    .limit(limite)

  if (user.role === 'admin') {
    requete.populate('user_id', 'nom prenom email departement role statut')
  }

  const pointages = await requete

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
