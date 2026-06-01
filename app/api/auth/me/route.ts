import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import User from '@/models/User'

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    )
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Token invalide ou expiré' },
      { status: 401 }
    )
  }

  await connectDB()
  const utilisateur = await User.findById(payload.id).select('-password')

  if (!utilisateur) {
    return NextResponse.json(
      { success: false, message: 'Utilisateur introuvable' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    utilisateur: {
      id: utilisateur._id.toString(),
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      role: utilisateur.role,
      statut: utilisateur.statut,
      matricule: utilisateur.matricule,
      poste: utilisateur.poste,
      departement: utilisateur.departement,
      soldeConges: utilisateur.soldeConges,
      telephone: utilisateur.telephone,
      createdAt: utilisateur.createdAt,
      updatedAt: utilisateur.updatedAt,
    },
  })
}

export async function PUT(request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Non authentifié' },
      { status: 401 }
    )
  }

  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json(
      { success: false, message: 'Token invalide ou expiré' },
      { status: 401 }
    )
  }

  try {
    const { nom, prenom, telephone } = await request.json()
    await connectDB()

    const utilisateur = await User.findByIdAndUpdate(
      payload.id,
      { nom, prenom, telephone },
      { new: true, select: '-password' }
    )

    if (!utilisateur) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      utilisateur: {
        id: utilisateur._id.toString(),
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        statut: utilisateur.statut,
        matricule: utilisateur.matricule,
        poste: utilisateur.poste,
        departement: utilisateur.departement,
        soldeConges: utilisateur.soldeConges,
        telephone: utilisateur.telephone,
        createdAt: utilisateur.createdAt,
        updatedAt: utilisateur.updatedAt,
      },
    })
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
}
