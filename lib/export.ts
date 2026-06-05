import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PointageExport {
  nom: string
  prenom: string
  date: string
  heure: string
  type: 'entree' | 'sortie'
  valide: boolean
  anomalie?: string
}

const EN_TETES = ['Nom', 'Prénom', 'Date', 'Heure', 'Type', 'Valide', 'Anomalie'] as const

function versLignes(data: PointageExport[]): string[][] {
  return data.map(p => [
    p.nom,
    p.prenom,
    p.date,
    p.heure,
    p.type === 'entree' ? 'Entrée' : 'Sortie',
    p.valide ? 'Oui' : 'Non',
    p.anomalie ?? '',
  ])
}

export function exportExcel(data: PointageExport[], filename: string): void {
  const lignes = data.map(p => ({
    'Nom':      p.nom,
    'Prénom':   p.prenom,
    'Date':     p.date,
    'Heure':    p.heure,
    'Type':     p.type === 'entree' ? 'Entrée' : 'Sortie',
    'Valide':   p.valide ? 'Oui' : 'Non',
    'Anomalie': p.anomalie ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(lignes)
  ws['!cols'] = [
    { wch: 16 }, // Nom
    { wch: 16 }, // Prénom
    { wch: 12 }, // Date
    { wch: 8  }, // Heure
    { wch: 10 }, // Type
    { wch: 8  }, // Valide
    { wch: 35 }, // Anomalie
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pointages')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportPDF(data: PointageExport[], filename: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const dateGen = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // ── En-tête ──────────────────────────────────────────────────────────────
  doc.setFontSize(20)
  doc.setTextColor(15, 23, 41)
  doc.text('Rapport de Pointage', 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Généré le ${dateGen}`, 14, 25)
  doc.text(
    `${data.length} enregistrement${data.length > 1 ? 's' : ''}`,
    doc.internal.pageSize.getWidth() - 14,
    25,
    { align: 'right' }
  )

  // ── Tableau ───────────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: 30,
    head: [EN_TETES as unknown as string[]],
    body: versLignes(data),
    headStyles: {
      fillColor:  [37, 99, 235],
      textColor:  255,
      fontStyle:  'bold',
      fontSize:   9,
      halign:     'left',
    },
    bodyStyles: {
      fontSize:    8,
      textColor:  [30, 41, 59],
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      3: { halign: 'center' }, // Heure
      4: { halign: 'center' }, // Type
      5: { halign: 'center' }, // Valide
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Page ${hookData.pageNumber} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    },
  })

  doc.save(`${filename}.pdf`)
}

export interface AnomalieExport {
  nom: string
  prenom: string
  matricule: string
  date: string
  type_anomalie: string
  detail: string
}

export function exportAnomaliesExcel(data: AnomalieExport[], filename: string): void {
  const lignes = data.map(a => ({
    'Prénom':    a.prenom,
    'Nom':       a.nom,
    'Matricule': a.matricule,
    'Date':      a.date,
    'Type':      a.type_anomalie,
    'Détail':    a.detail,
  }))

  const ws = XLSX.utils.json_to_sheet(lignes)
  ws['!cols'] = [
    { wch: 14 }, // Prénom
    { wch: 14 }, // Nom
    { wch: 12 }, // Matricule
    { wch: 12 }, // Date
    { wch: 22 }, // Type
    { wch: 50 }, // Détail
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Anomalies')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── Rapport de présence ───────────────────────────────────────────────────────

export interface PresenceRapport {
  nom: string
  prenom: string
  joursPresents: number
  joursAbsents: number
  retards: number
  tauxPresence: string
}

export function exportPresenceExcel(data: PresenceRapport[], filename: string): void {
  const lignes = data.map(p => ({
    'Nom':             p.nom,
    'Prénom':          p.prenom,
    'Jours présents':  p.joursPresents,
    'Jours absents':   p.joursAbsents,
    'Retards':         p.retards,
    'Taux présence':   p.tauxPresence,
  }))

  const ws = XLSX.utils.json_to_sheet(lignes)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 15 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Présence')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function exportPresencePDF(data: PresenceRapport[], filename: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const dateGen = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  doc.setFontSize(20)
  doc.setTextColor(15, 23, 41)
  doc.text('Rapport de Présence', 14, 18)

  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Généré le ${dateGen}`, 14, 25)
  doc.text(
    `${data.length} employé${data.length > 1 ? 's' : ''}`,
    doc.internal.pageSize.getWidth() - 14,
    25,
    { align: 'right' }
  )

  autoTable(doc, {
    startY: 30,
    head: [['Nom', 'Prénom', 'Jours présents', 'Jours absents', 'Retards', 'Taux présence']],
    body: data.map(p => [p.nom, p.prenom, p.joursPresents, p.joursAbsents, p.retards, p.tauxPresence]),
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59], cellPadding: 3 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Page ${hookData.pageNumber} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      )
    },
  })

  doc.save(`${filename}.pdf`)
}

// ── Rapport de congés ─────────────────────────────────────────────────────────

export interface CongeRapport {
  nom: string
  prenom: string
  matricule: string
  type: string
  dateDebut: string
  dateFin: string
  duree: number
  statut: string
}

export function exportCongesExcel(data: CongeRapport[], filename: string): void {
  const lignes = data.map(c => ({
    'Nom':        c.nom,
    'Prénom':     c.prenom,
    'Matricule':  c.matricule,
    'Type':       c.type,
    'Date début': c.dateDebut,
    'Date fin':   c.dateFin,
    'Durée (j)':  c.duree,
    'Statut':     c.statut,
  }))

  const ws = XLSX.utils.json_to_sheet(lignes)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Congés')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// ── Rapport d'anomalies résumé ────────────────────────────────────────────────

export interface AnomalieRapport {
  nom: string
  prenom: string
  matricule: string
  retards: number
  absences: number
  sortiesAnticipees: number
  heuresInsuffisantes: number
  total: number
}

export function exportAnomaliesResumeExcel(data: AnomalieRapport[], filename: string): void {
  const lignes = data.map(a => ({
    'Nom':                 a.nom,
    'Prénom':              a.prenom,
    'Matricule':           a.matricule,
    'Retards':             a.retards,
    'Absences':            a.absences,
    'Sorties anticipées':  a.sortiesAnticipees,
    'Heures insuf.':       a.heuresInsuffisantes,
    'Total':               a.total,
  }))

  const ws = XLSX.utils.json_to_sheet(lignes)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 16 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 14 },
    { wch: 8  },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Anomalies résumé')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
