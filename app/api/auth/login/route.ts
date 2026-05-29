import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    await connectDB()

    const utilisateur = await User.findOne({ email })
    if (!utilisateur) {
      return NextResponse.json(
        { success: false, message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const motDePasseValide = await bcrypt.compare(password, utilisateur.password)
    if (!motDePasseValide) {
      return NextResponse.json(
        { success: false, message: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    const token = generateToken({
      id: utilisateur._id.toString(),
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
    })

    // Cookie httpOnly — inaccessible depuis le JS client
    const cookieStore = await cookies()
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      utilisateur: {
        id: utilisateur._id.toString(),
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
