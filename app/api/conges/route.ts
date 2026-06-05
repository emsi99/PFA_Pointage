import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import Conge from '@/models/Conge'

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token ? verifyToken(token) : null
}

export async function GET() {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  await connectDB()

  const conges = await Conge.find({ user_id: user.id }).sort({ createdAt: -1 })

  return NextResponse.json({ success: true, data: conges })
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Corps de requête invalide' }, { status: 400 })
  }

  const { date_debut, date_fin, type, motif } = body

  if (!date_debut || !date_fin || !type || !motif?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Tous les champs sont obligatoires' },
      { status: 400 }
    )
  }

  const debut = new Date(date_debut)
  const fin = new Date(date_fin)

  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return NextResponse.json({ success: false, message: 'Dates invalides' }, { status: 400 })
  }

  if (fin < debut) {
    return NextResponse.json(
      { success: false, message: 'La date de fin doit être après la date de début' },
      { status: 400 }
    )
  }

  if (!['annuel', 'maladie', 'exceptionnel'].includes(type)) {
    return NextResponse.json({ success: false, message: 'Type de congé invalide' }, { status: 400 })
  }

  await connectDB()

  const chevauchement = await Conge.findOne({
    user_id: user.id,
    statut: { $in: ['en_attente', 'valide'] },
    date_debut: { $lte: fin },
    date_fin: { $gte: debut },
  })

  if (chevauchement) {
    return NextResponse.json(
      { success: false, message: 'Vous avez déjà une demande de congé sur cette période' },
      { status: 400 }
    )
  }

  const conge = await Conge.create({
    user_id: user.id,
    date_debut: debut,
    date_fin: fin,
    type,
    motif: motif.trim(),
    statut: 'en_attente',
  })

  return NextResponse.json({ success: true, data: conge }, { status: 201 })
}
