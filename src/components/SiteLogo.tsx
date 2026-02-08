'use client'

import { useState, useEffect } from 'react'

export function SiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/site-settings')
      .then(res => res.json())
      .then(data => {
        if (data.siteLogo) {
          setLogoUrl(data.siteLogo)
        }
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    // Logo par défaut pendant le chargement
    return (
      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
        <span className="font-display font-bold text-white text-lg">A4L</span>
      </div>
    )
  }

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="A4L Logo"
        className="w-10 h-10 object-contain"
        onError={() => setLogoUrl(null)}
      />
    )
  }

  // Logo par défaut
  return (
    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
      <span className="font-display font-bold text-white text-lg">A4L</span>
    </div>
  )
}
