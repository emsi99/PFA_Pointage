import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { connectDB } from '@/lib/mongodb'
import { verifyToken } from '@/lib/auth'
import Pointage from '@/models/Pointage'
import User from '@/models/User'

async function getAuthUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  return token ? verifyToken(token) : null
}

function heureEnMinutes(heure: string): number {
  const [h, m] = heure.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return 0
  return h * 60 + m
}

const TYPES_VALIDES = ['retard', 'absence', 'sortie_anticipee', 'heures_insuffisantes'] as const
type TypeAnomalie = (typeof TYPES_VALIDES)[number]

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) return NextResponse.json({ success: false, message: 'Non authentifié' }, { status: 401 })
  if (user.role !== 'admin') return NextResponse.json({ success: false, message: 'Accès refusé' }, { status: 403 })

  await connectDB()

  const depuisParam = req.nextUrl.searchParams.get('depuis')
  const typeParam   = req.nextUrl.searchParams.get('type')
  const nbJours     = Math.min(Math.max(1, parseInt(depuisParam ?? '30', 10) || 30), 90)
  const filtreType  = typeParam && (TYPES_VALIDES as readonly string[]).includes(typeParam)
    ? (typeParam as TypeAnomalie)
    : null

  // Build list of working days (Mon–Fri) within the range
  const joursOuvres: string[] = []
  for (let i = nbJours - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) {
      joursOuvres.push(d.toISOString().split('T')[0])
    }
  }

  const [pointages, employes] = await Promise.all([
    Pointage.find({ date: { $in: joursOuvres } }, 'user_id date heure type').lean(),
    User.find({ role: 'employe', statut: 'actif' }, 'nom prenom matricule').lean(),
  ])

  // Map uid → (date → { entrees[], sorties[] })
  type JourInfo = { entrees: string[]; sorties: string[] }
  const parUser = new Map<string, Map<string, JourInfo>>()

  for (const p of pointages) {
    const uid = p.user_id.toString()
    if (!parUser.has(uid)) parUser.set(uid, new Map())
    const parDate = parUser.get(uid)!
    if (!parDate.has(p.date)) parDate.set(p.date, { entrees: [], sorties: [] })
    const jour = parDate.get(p.date)!
    if (p.type === 'entree') jour.entrees.push(p.heure)
    else jour.sorties.push(p.heure)
  }

  type Anomalie = {
    user_id: string
    nom: string
    prenom: string
    matricule: string
    date: string
    type_anomalie: TypeAnomalie
    detail: string
  }

  const anomalies: Anomalie[] = []

  for (const emp of employes) {
    const uid       = (emp._id as { toString(): string }).toString()
    const nom       = emp.nom
    const prenom    = emp.prenom
    const matricule = emp.matricule ?? ''
    const parDate   = parUser.get(uid)

    for (const date of joursOuvres) {
      const jour = parDate?.get(date)

      // ── Absence ────────────────────────────────────────────────────────────
      if (!jour || jour.entrees.length === 0) {
        if (!filtreType || filtreType === 'absence') {
          anomalies.push({ user_id: uid, nom, prenom, matricule, date, type_anomalie: 'absence', detail: 'Aucun pointage enregistré' })
        }
        continue
      }

      const premiereEntree = [...jour.entrees].sort()[0]
      const derniereSortie = jour.sorties.length > 0 ? [...jour.sorties].sort().at(-1)! : null
      const minutesEntree  = heureEnMinutes(premiereEntree)

      // ── Retard ─────────────────────────────────────────────────────────────
      if (minutesEntree > 8 * 60 + 15 && (!filtreType || filtreType === 'retard')) {
        const retard = minutesEntree - (8 * 60 + 15)
        const detail = retard >= 60
          ? `Arrivée à ${premiereEntree} (retard de ${Math.floor(retard / 60)}h${retard % 60 > 0 ? ` ${retard % 60}m` : ''})`
          : `Arrivée à ${premiereEntree} (retard de ${retard} min)`
        anomalies.push({ user_id: uid, nom, prenom, matricule, date, type_anomalie: 'retard', detail })
      }

      // ── Sortie anticipée ───────────────────────────────────────────────────
      if (derniereSortie && heureEnMinutes(derniereSortie) < 17 * 60 && (!filtreType || filtreType === 'sortie_anticipee')) {
        anomalies.push({ user_id: uid, nom, prenom, matricule, date, type_anomalie: 'sortie_anticipee', detail: `Départ à ${derniereSortie} (avant 17h00)` })
      }

      // ── Heures insuffisantes ───────────────────────────────────────────────
      if (derniereSortie && (!filtreType || filtreType === 'heures_insuffisantes')) {
        const duree = heureEnMinutes(derniereSortie) - minutesEntree
        if (duree >= 0 && duree < 7 * 60) {
          const h = Math.floor(duree / 60)
          const m = duree % 60
          anomalies.push({
            user_id: uid, nom, prenom, matricule, date,
            type_anomalie: 'heures_insuffisantes',
            detail: `${h}h${m > 0 ? ` ${m}m` : ''} travaillées (minimum 7h)`,
          })
        }
      }
    }
  }

  // Most recent first, then alphabetical
  anomalies.sort((a, b) => b.date.localeCompare(a.date) || a.nom.localeCompare(b.nom))

  return NextResponse.json({ success: true, anomalies })
}
