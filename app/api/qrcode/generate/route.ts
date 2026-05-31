import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { connectDB } from '@/lib/mongodb'
import QRToken from '@/models/QRToken'

export async function GET() {
  await connectDB()

  // Delete old tokens
  await QRToken.deleteMany({})

  // Create new token valid for 5 minutes
  const token = uuidv4()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  await QRToken.create({ token, expiresAt })

  return NextResponse.json({ token, expiresAt })
}