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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Corps de requête invalide' }, { status: 400 })
  }

  const { action, commentaire } = body

  if (action !== 'valide' && action !== 'refuse') {
    return NextResponse.json({ success: false, message: 'Action invalide : valide ou refuse attendu' }, { status: 400 })
  }

  const { id } = await params

  await connectDB()

  const conge = await Conge.findById(id)
  if (!conge) {
    return NextResponse.json({ success: false, message: 'Demande introuvable' }, { status: 404 })
  }

  if (conge.statut !== 'en_attente') {
    return NextResponse.json(
      { success: false, message: 'Cette demande a déjà été traitée' },
      { status: 400 }
    )
  }

  conge.statut = action
  conge.validePar = user.id as unknown as typeof conge.validePar
  conge.dateValidation = new Date()
  if (commentaire?.trim()) conge.commentaire = commentaire.trim()

  await conge.save()

  return NextResponse.json({ success: true, data: conge })
}
