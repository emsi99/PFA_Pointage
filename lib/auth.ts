import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function generateToken(user: { id: string; role: string; email: string }) {
return jwt.sign(user, JWT_SECRET, { expiresIn: '15m' })
}

export function verifyToken(token: string) {
try {
    return jwt.verify(token, JWT_SECRET)
} catch {
    return null
}
}