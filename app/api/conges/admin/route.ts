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

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
  }

  await connectDB()

  const statut = req.nextUrl.searchParams.get('statut')
  const filtre: Record<string, unknown> = {}
  if (statut && ['en_attente', 'valide', 'refuse'].includes(statut)) {
    filtre.statut = statut
  }

  const conges = await Conge.find(filtre)
    .populate('user_id', 'nom prenom matricule')
    .sort({ createdAt: -1 })

  return NextResponse.json({ success: true, data: conges })
}
