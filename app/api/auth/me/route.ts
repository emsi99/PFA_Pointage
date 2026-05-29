import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

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

  return NextResponse.json({
    success: true,
    utilisateur: {
      id: payload.id,
      nom: payload.nom,
      email: payload.email,
      role: payload.role,
    },
  })
}
