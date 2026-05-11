import { useState } from 'react'

export function useFavoris() {
  const [favoris, setFavoris] = useState(() => {
    const saved = localStorage.getItem('unihome-favoris')
    return saved ? JSON.parse(saved) : []
  })

  const toggleFavori = (id) => {
    setFavoris(prev => {
      const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
      localStorage.setItem('unihome-favoris', JSON.stringify(next))
      return next
    })
  }

  const isFavori = (id) => favoris.includes(id)

  return { favoris, toggleFavori, isFavori }
}
