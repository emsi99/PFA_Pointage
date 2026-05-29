import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Pointage from '@/models/Pointage'

export async function GET() {
  try {
    await connectDB()

    const dateAujourdhui = new Date().toISOString().split('T')[0]

    const [totalEmployes, employesActifs, admins, pointagesAujourdhui, derniersPointages, derniersEmployes] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ statut: 'actif' }),
        User.countDocuments({ role: 'admin' }),
        Pointage.countDocuments({ date: dateAujourdhui, type: 'entree' }),
        Pointage.find({ date: dateAujourdhui })
          .sort({ createdAt: -1 })
          .limit(3)
          .populate('user_id', 'nom prenom'),
        User.find({}, { nom: 1, prenom: 1, createdAt: 1 })
          .sort({ createdAt: -1 })
          .limit(3),
      ])

    const tauxPresence =
      employesActifs > 0
        ? Math.round((pointagesAujourdhui / employesActifs) * 100)
        : 0

    // Construction de l'activité récente
    type Activite = { type: string; description: string; heure: string; createdAt: Date }
    const activites: Activite[] = []

    for (const p of derniersPointages) {
      const u = p.user_id as unknown as { nom: string; prenom: string }
      activites.push({
        type: 'pointage',
        description: `Pointage ${p.type === 'entree' ? 'entrée' : 'sortie'} — ${u?.prenom ?? ''} ${u?.nom ?? ''}`,
        heure: p.heure,
        createdAt: p.createdAt as Date,
      })
    }

    for (const emp of derniersEmployes) {
      activites.push({
        type: 'employe_cree',
        description: `Nouveau compte créé — ${emp.prenom} ${emp.nom}`,
        heure: (emp.createdAt as Date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        createdAt: emp.createdAt as Date,
      })
    }

    activites.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return NextResponse.json({
      success: true,
      data: {
        totalEmployes,
        employesActifs,
        admins,
        tauxPresence,
        activiteRecente: activites.slice(0, 5).map(a => ({
          type: a.type,
          description: a.description,
          heure: a.heure,
        })),
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
