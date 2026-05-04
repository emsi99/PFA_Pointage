import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import { generateToken } from '@/lib/auth'
import User from '@/models/User'

export async function POST(request: NextRequest) {
try {
    const { email, password } = await request.json()

    // 1. Vérifier que email et password sont fournis
    if (!email || !password) {
    return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
    )
    }

    // 2. Connecter à MongoDB
    await connectDB()

    // 3. Chercher l'utilisateur par email
    const user = await User.findOne({ email })
    if (!user) {
    return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
    )
    }

    // 4. Vérifier le mot de passe
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
    return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
    )
    }

    // 5. Générer le token JWT
    const token = generateToken({
    id: user._id.toString(),
    role: user.role,
    email: user.email
    })

    // 6. Retourner le token + infos utilisateur
    return NextResponse.json({
    token,
    user: {
        id: user._id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role
    }
    })

} catch (error) {
    return NextResponse.json(
    { error: 'Erreur serveur' },
    { status: 500 }
    )
}
}