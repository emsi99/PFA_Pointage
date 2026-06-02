import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  console.error('JWT_SECRET is not defined in environment variables')
}

export interface TokenPayload {
  id: string
  nom: string
  email: string
  role: string
}

export const generateToken = (utilisateur: TokenPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET manquant')
  }
  return jwt.sign(utilisateur, JWT_SECRET, { expiresIn: '8h' })
}

export const verifyToken = (token: string): TokenPayload | null => {
  if (!JWT_SECRET) return null
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}
