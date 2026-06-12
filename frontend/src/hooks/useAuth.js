import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { setAxiosToken, setAxiosLogout } from '../api/axios'

export const AuthContext = createContext(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider')
  return ctx
}

export function useAuthProvider() {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) } catch { return null }
  })

  const login = useCallback((tokenFromServer, userData) => {
    localStorage.setItem('auth_token', tokenFromServer)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    setToken(tokenFromServer)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((userData) => {
    setUser((current) => ({ ...current, ...userData }))
  }, [])

  useEffect(() => {
    setAxiosToken(token)
  }, [token])

  useEffect(() => {
    setAxiosLogout(logout)
  }, [logout])

  const isLoggedIn = !!token
  const role = user?.role || null

  return { user, token, role, isLoggedIn, login, logout, updateUser }
}
