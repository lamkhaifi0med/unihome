import { useCallback, useEffect, useState } from 'react'
import { favorisApi } from '../api/favorisApi'
import { useAuth } from './useAuth'

const eventName = 'unihome:favoris-changed'
let cachedFavoris = null
let loadingPromise = null

function emitFavoris(ids) {
  cachedFavoris = ids
  window.dispatchEvent(new CustomEvent(eventName, { detail: ids }))
}

export function useFavoris() {
  const { user, isLoggedIn } = useAuth()
  const [favoris, setFavoris] = useState([])
  const [loadingFavoris, setLoadingFavoris] = useState(false)

  const loadFavoris = useCallback(async () => {
    if (!isLoggedIn || user?.role !== 'ETUDIANT') {
      cachedFavoris = null
      setFavoris([])
      return
    }

    try {
      if (cachedFavoris) {
        setFavoris(cachedFavoris)
        return
      }

      setLoadingFavoris(true)
      if (!loadingPromise) {
        loadingPromise = favorisApi.getMine().finally(() => {
          loadingPromise = null
        })
      }
      const response = await loadingPromise
      const ids = response.data || []
      setFavoris(ids)
      emitFavoris(ids)
    } catch {
      setFavoris([])
    } finally {
      setLoadingFavoris(false)
    }
  }, [isLoggedIn, user?.role])

  useEffect(() => {
    loadFavoris()
  }, [loadFavoris])

  useEffect(() => {
    const handler = (event) => setFavoris(event.detail || [])
    window.addEventListener(eventName, handler)
    return () => window.removeEventListener(eventName, handler)
  }, [])

  const isFavori = useCallback((id) => favoris.some((favoriId) => String(favoriId) === String(id)), [favoris])

  const toggleFavori = useCallback(async (id) => {
    if (!isLoggedIn || user?.role !== 'ETUDIANT') {
      throw new Error('LOGIN_REQUIRED')
    }

    const alreadyFavori = favoris.some((favoriId) => String(favoriId) === String(id))
    const next = alreadyFavori
      ? favoris.filter((favoriId) => String(favoriId) !== String(id))
      : [...favoris, id]

    setFavoris(next)
    emitFavoris(next)

    try {
      if (alreadyFavori) {
        await favorisApi.remove(id)
      } else {
        await favorisApi.add(id)
      }
    } catch (error) {
      setFavoris(favoris)
      emitFavoris(favoris)
      throw error
    }
  }, [favoris, isLoggedIn, user?.role])

  return { favoris, loadingFavoris, toggleFavori, isFavori, reloadFavoris: loadFavoris }
}
