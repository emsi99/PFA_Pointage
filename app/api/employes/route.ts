import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET() {
  try {
    await connectDB()

    const employes = await User.find({}, { password: 0 }).sort({ createdAt: -1 })

    return NextResponse.json({
      success: true,
      data: employes,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
