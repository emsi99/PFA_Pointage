import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import Pointage from '@/models/Pointage'

const JOURS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function heureEnMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

function formatHeures(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export async function GET() {
  try {
    await connectDB()

    // ── Dates utiles ────────────────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]

    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return { date: d.toISOString().split('T')[0], jour: JOURS_FR[d.getDay()] }
    })
    const last7Dates = last7.map(j => j.date)

    // ── Compteurs utilisateurs ──────────────────────────────────────────────
    const [totalEmployes, employesActifs, admins] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ statut: 'actif', role: 'employe' }),
      User.countDocuments({ role: 'admin' }),
    ])

    // ── Pointages aujourd'hui ───────────────────────────────────────────────
    const pointagesAujourdhui = await Pointage.find({ date: today }).lean()

    const premiereEntree = new Map<string, string>()
    const derniereSortie = new Map<string, string>()

    for (const p of pointagesAujourdhui) {
      const uid = p.user_id.toString()
      if (p.type === 'entree') {
        const ex = premiereEntree.get(uid)
        if (!ex || p.heure < ex) premiereEntree.set(uid, p.heure)
      } else {
        const ex = derniereSortie.get(uid)
        if (!ex || p.heure > ex) derniereSortie.set(uid, p.heure)
      }
    }

    const presents = premiereEntree.size
    const absents  = Math.max(0, employesActifs - presents)

    let retards = 0
    for (const heure of premiereEntree.values()) {
      if (heureEnMinutes(heure) > 8 * 60 + 15) retards++
    }

    let sortieAnticipee = 0
    for (const heure of derniereSortie.values()) {
      if (heureEnMinutes(heure) < 17 * 60) sortieAnticipee++
    }

    let heuresInsuffisantes = 0
    for (const [uid, entree] of premiereEntree.entries()) {
      const sortie = derniereSortie.get(uid)
      if (sortie && heureEnMinutes(sortie) - heureEnMinutes(entree) < 7 * 60) {
        heuresInsuffisantes++
      }
    }

    const tauxPresence = employesActifs > 0
      ? Math.round((presents / employesActifs) * 100)
      : 0

    // ── Pointages 7 derniers jours ──────────────────────────────────────────
    const pointages7j = await Pointage.find({ date: { $in: last7Dates } }).lean()

    type JourData = { entrees: Map<string, string>; sorties: Map<string, string> }
    const parJour = new Map<string, JourData>()
    for (const { date } of last7) {
      parJour.set(date, { entrees: new Map(), sorties: new Map() })
    }

    for (const p of pointages7j) {
      const uid  = p.user_id.toString()
      const jour = parJour.get(p.date)
      if (!jour) continue
      if (p.type === 'entree') {
        const ex = jour.entrees.get(uid)
        if (!ex || p.heure < ex) jour.entrees.set(uid, p.heure)
      } else {
        const ex = jour.sorties.get(uid)
        if (!ex || p.heure > ex) jour.sorties.set(uid, p.heure)
      }
    }

    const evolution_semaine: { jour: string; presents: number; absents: number }[] = []
    const heures_par_jour:   { jour: string; heures: number }[] = []
    let totalMinutesSemaine = 0

    for (const { date, jour } of last7) {
      const data = parJour.get(date)!
      const presentsJour = data.entrees.size
      evolution_semaine.push({
        jour,
        presents: presentsJour,
        absents: Math.max(0, employesActifs - presentsJour),
      })

      let minutesJour = 0
      for (const [uid, entree] of data.entrees.entries()) {
        const sortie = data.sorties.get(uid)
        if (sortie) {
          const duree = heureEnMinutes(sortie) - heureEnMinutes(entree)
          if (duree > 0) minutesJour += duree
        }
      }
      totalMinutesSemaine += minutesJour
      heures_par_jour.push({
        jour,
        heures: Math.round((minutesJour / 60) * 10) / 10,
      })
    }

    // ── Données graphique donut ─────────────────────────────────────────────
    const repartition_types = [
      { name: 'Présents', value: Math.max(0, presents - retards) },
      { name: 'Retards',  value: retards },
      { name: 'Absents',  value: absents },
    ]

    // ── Activité récente ────────────────────────────────────────────────────
    const [derniersPointages, derniersEmployes] = await Promise.all([
      Pointage.find({ date: today })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('user_id', 'nom prenom'),
      User.find({}, { nom: 1, prenom: 1, createdAt: 1 })
        .sort({ createdAt: -1 })
        .limit(3),
    ])

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
        presents,
        absents,
        retards,
        sortieAnticipee,
        heuresInsuffisantes,
        heures_semaine: formatHeures(totalMinutesSemaine),
        evolution_semaine,
        repartition_types,
        heures_par_jour,
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
