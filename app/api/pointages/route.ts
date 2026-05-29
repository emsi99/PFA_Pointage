import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import Pointage from '@/models/Pointage'

// GET — historique des pointages de l'employé connecté
export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, message: 'Token invalide' }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(request.url)
  const limite = Math.min(parseInt(searchParams.get('limite') ?? '20'), 50)

  const pointages = await Pointage.find({ user_id: payload.id })
    .sort({ date: -1, heure: -1 })
    .limit(limite)

  return NextResponse.json({ success: true, data: pointages })
}

// POST — enregistrer un pointage
export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })

  const payload = verifyToken(token)
  if (!payload) return NextResponse.json({ success: false, message: 'Token invalide' }, { status: 401 })

  const body = await request.json()
  const { type, latitude, longitude } = body as {
    type: 'entree' | 'sortie'
    latitude: number
    longitude: number
  }

  if (!type || !['entree', 'sortie'].includes(type)) {
    return NextResponse.json({ success: false, message: 'Type de pointage invalide' }, { status: 400 })
  }

  await connectDB()

  const maintenant = new Date()
  const date = maintenant.toISOString().slice(0, 10)
  const heure = maintenant.toTimeString().slice(0, 5)

  const pointage = await Pointage.create({
    user_id: payload.id,
    date,
    heure,
    type,
    latitude:  latitude  ?? 0,
    longitude: longitude ?? 0,
    valide:    true,
  })

  return NextResponse.json({ success: true, data: pointage }, { status: 201 })
}
