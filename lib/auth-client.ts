export interface Utilisateur {
  id: string
  nom: string
  prenom?: string
  email: string
  role: 'admin' | 'employe'
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
