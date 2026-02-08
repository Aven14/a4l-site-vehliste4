'use client'

import { useEffect } from 'react'

export function Favicon() {
  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.siteFavicon) {
          // Supprimer l'ancien favicon s'il existe
          const existingFavicon = document.querySelector('link[rel="icon"]')
          if (existingFavicon) {
            existingFavicon.remove()
          }

          // Ajouter le nouveau favicon
          const link = document.createElement('link')
          link.rel = 'icon'
          link.href = data.siteFavicon
          document.head.appendChild(link)
        }
      })
      .catch(() => {
        // Ignorer les erreurs
      })
  }, [])

  return null
}
