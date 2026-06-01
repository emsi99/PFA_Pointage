export interface Utilisateur {
  id: string
  nom: string
  prenom?: string
  email: string
  role: 'admin' | 'employe'
  statut?: 'actif' | 'inactif'
  matricule?: string
  poste?: string
  departement?: string
  soldeConges?: number
  telephone?: string
  createdAt?: string
  updatedAt?: string
}

// Récupère l'utilisateur courant via le cookie httpOnly
export async function getUser(): Promise<Utilisateur | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.utilisateur ?? null
  } catch {
    return null
  }
}

// Déconnecte l'utilisateur côté serveur (supprime le cookie)
export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'DELETE' })
}

// Met à jour l'utilisateur courant
export async function updateUser(data: Partial<Utilisateur>): Promise<Utilisateur | null> {
  try {
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const result = await res.json()
    return result.utilisateur ?? null
  } catch {
    return null
  }
}
