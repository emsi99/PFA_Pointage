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

  await connectDB()

  const sinceParam = req.nextUrl.searchParams.get('since')
  const since = sinceParam && !isNaN(Date.parse(sinceParam))
    ? new Date(sinceParam)
    : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const conges = await Conge.find({
    user_id: user.id,
    statut: { $in: ['valide', 'refuse'] },
    dateValidation: { $gte: since },
  })
    .select('_id type statut date_debut date_fin commentaire dateValidation')
    .sort({ dateValidation: -1 })

  return NextResponse.json({
    success: true,
    count: conges.length,
    conges,
  })
}
