'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const user = session?.user as any

  useEffect(() => {
    if (user?.themeColor) {
      // Convertir la couleur hex en RGB pour les opacités
      const hex = user.themeColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      // Calculer les variantes de couleur
      const lighten = (color: number, percent: number) => 
        Math.min(255, Math.round(color + (255 - color) * percent))
      const darken = (color: number, percent: number) => 
        Math.max(0, Math.round(color * (1 - percent)))

      // Appliquer les variables CSS
      document.documentElement.style.setProperty('--accent-color', user.themeColor)
      document.documentElement.style.setProperty('--accent-color-400', `rgb(${lighten(r, 0.3)}, ${lighten(g, 0.3)}, ${lighten(b, 0.3)})`)
      document.documentElement.style.setProperty('--accent-color-500', user.themeColor)
      document.documentElement.style.setProperty('--accent-color-600', `rgb(${darken(r, 0.1)}, ${darken(g, 0.1)}, ${darken(b, 0.1)})`)
      document.documentElement.style.setProperty('--accent-color-700', `rgb(${darken(r, 0.2)}, ${darken(g, 0.2)}, ${darken(b, 0.2)})`)
      document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`)
    } else {
      // Réinitialiser aux valeurs par défaut (violet)
      document.documentElement.style.setProperty('--accent-color', '#a855f7')
      document.documentElement.style.setProperty('--accent-color-400', '#c084fc')
      document.documentElement.style.setProperty('--accent-color-500', '#a855f7')
      document.documentElement.style.setProperty('--accent-color-600', '#9333ea')
      document.documentElement.style.setProperty('--accent-color-700', '#7e22ce')
      document.documentElement.style.setProperty('--accent-color-rgb', '168, 85, 247')
    }
  }, [user?.themeColor])

  return <>{children}</>
}
