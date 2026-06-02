import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { connectDB } from '@/lib/mongodb'
import QRToken from '@/models/QRToken'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

const DEFAULT_RADIUS_METERS = 100

function isValidCoordinate(latitude: unknown, longitude: unknown) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('token')?.value
  const payload = authToken ? verifyToken(authToken) : null

  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Non autorisé' }, { status: 403 })
  }

  const { latitude, longitude } = await req.json()

  if (!isValidCoordinate(latitude, longitude)) {
    return NextResponse.json(
      { success: false, message: 'Position GPS admin invalide' },
      { status: 400 }
    )
  }

  await connectDB()

  // Delete old tokens
  await QRToken.deleteMany({})

  // Create new token valid for 5 minutes
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await QRToken.create({
    token,
    expiresAt,
    latitude,
    longitude,
    radiusMeters: DEFAULT_RADIUS_METERS,
  })

  return NextResponse.json({
    success: true,
    token,
    expiresAt,
    latitude,
    longitude,
    radiusMeters: DEFAULT_RADIUS_METERS,
  })
}
