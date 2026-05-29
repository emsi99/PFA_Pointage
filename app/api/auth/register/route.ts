import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { nom, prenom, email, password, departement, role } = await request.json()

    if (!nom || !prenom || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Nom, prénom, email et mot de passe sont requis' },
        { status: 400 }
      )
    }

    await connectDB()

    const existant = await User.findOne({ email })
    if (existant) {
      return NextResponse.json(
        { success: false, message: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    const motDePasseHashe = await bcrypt.hash(password, 12)

    const nouvelUtilisateur = await User.create({
      nom,
      prenom,
      email,
      password: motDePasseHashe,
      departement: departement || undefined,
      role: role === 'admin' ? 'admin' : 'employe',
      statut: 'actif',
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          id: nouvelUtilisateur._id,
          nom: nouvelUtilisateur.nom,
          prenom: nouvelUtilisateur.prenom,
          email: nouvelUtilisateur.email,
          role: nouvelUtilisateur.role,
        },
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
