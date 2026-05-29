import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify, type JWTPayload } from 'jose'

interface PayloadToken extends JWTPayload {
  id: string
  nom: string
  email: string
  role: string
}

// Routes accessibles sans authentification
const ROUTES_PUBLIQUES = ['/api/auth/login', '/api/auth/logout', '/api/auth/me']

// Routes API réservées aux admins
const ROUTES_API_ADMIN = ['/api/auth/register', '/api/employes', '/api/stats']

async function verifierToken(token: string): Promise<PayloadToken | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? '')
    const { payload } = await jwtVerify(token, secret)
    return payload as PayloadToken
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Routes publiques — pas de vérification
  if (ROUTES_PUBLIQUES.includes(pathname)) {
    return NextResponse.next()
  }

  // Lecture du cookie httpOnly
  const token = request.cookies.get('token')?.value

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifierToken(token)

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Vérification rôle admin (pages + API)
  const estPageAdmin = pathname.startsWith('/admin/')
  const estApiAdmin = ROUTES_API_ADMIN.some(r => pathname.startsWith(r))

  if ((estPageAdmin || estApiAdmin) && payload.role !== 'admin') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Accès refusé : droits administrateur requis' },
        { status: 403 }
      )
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Vérification rôle employé (pages seulement)
  if (pathname.startsWith('/employe/') && payload.role !== 'employe') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*', '/employe/:path*'],
}
