import { useState, createContext, useContext } from 'react'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthProvider() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unihome-user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (email, password, role = 'ETUDIANT') => {
    const mockUser = {
      id: 1,
      nom: role === 'ADMIN' ? 'Admin UniHome' : role === 'PROPRIETAIRE' ? 'Rachid Benmoussa' : 'Imane Karimi',
      prenom: '',
      email,
      role,
      universite: role === 'ETUDIANT' ? 'ENCG Casablanca' : null,
      avatar: null,
    }
    setUser(mockUser)
    localStorage.setItem('unihome-user', JSON.stringify(mockUser))
    return mockUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('unihome-user')
  }

  return { user, login, logout }
}
