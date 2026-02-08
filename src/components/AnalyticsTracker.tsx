'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // Gestion du sessionId (visiteur unique)
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    // Attendre un peu pour s'assurer que la page est chargée
    const timer = setTimeout(() => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: pathname,
          sessionId: sessionId
        }),
      }).catch(err => console.error('Failed to track visit:', err))
    }, 1000)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
