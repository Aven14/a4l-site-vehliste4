'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function AnalyticsTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    // Attendre un peu pour s'assurer que la page est chargée
    const timer = setTimeout(() => {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: pathname }),
      }).catch(err => console.error('Failed to track visit:', err))
    }, 1000)

    return () => clearTimeout(timer)
  }, [pathname])

  return null
}
