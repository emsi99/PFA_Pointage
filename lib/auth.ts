import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export interface TokenPayload {
  id: string
  nom: string
  email: string
  role: string
}

export const generateToken = (utilisateur: TokenPayload): string =>
  jwt.sign(utilisateur, JWT_SECRET, { expiresIn: '8h' })

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload
  } catch {
    return null
  }
}
