import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await connectDB()

    const employe = await User.findByIdAndDelete(id)
    if (!employe) {
      return NextResponse.json(
        { success: false, message: 'Employé introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Employé supprimé avec succès',
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { nom, departement, role, statut } = await request.json()

    await connectDB()

    const employe = await User.findByIdAndUpdate(
      id,
      { nom, departement, role, statut },
      { new: true, select: '-password' }
    )

    if (!employe) {
      return NextResponse.json(
        { success: false, message: 'Employé introuvable' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: employe,
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
