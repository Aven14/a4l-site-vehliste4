'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ImportPage() {
  const { status } = useSession()
  const router = useRouter()
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  if (status === 'unauthenticated') {
    router.push('/admin/login')
    return null
  }

  const handleImport = async () => {
    setLoading(true)
    setResult(null)

    try {
      const data = JSON.parse(json)
      const vehicles = Array.isArray(data) ? data : data.vehicles

      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicles }),
      })

      const result = await res.json()
      setResult(result)
    } catch (e) {
      setResult({ error: 'JSON invalide' })
    } finally {
      setLoading(false)
    }
  }

  const exampleJson = `[
  {
    "brand": "BMW",
    "name": "M3 G80",
    "price": 108000,
    "vmax": 290,
    "power": 510,
    "seats": 4,
    "trunk": 25,
    "category": "sport"
  },
  {
    "brand": "Ferrari",
    "name": "488 Pista 2019",
    "price": 400000,
    "vmax": 340,
    "power": 720,
    "seats": 1,
    "trunk": 10,
    "category": "supercar"
  }
]`

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Import <span className="text-primary-400">JSON</span>
        </h1>
        <p className="text-gray-400 mb-8">Importez des véhicules en masse depuis un fichier JSON</p>

        <div className="card p-6 mb-6">
          <h2 className="font-semibold text-white mb-4">Format attendu</h2>
          <pre className="bg-dark-300 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto">
            {exampleJson}
          </pre>
          <p className="text-gray-500 text-sm mt-4">
            Champs: brand (requis), name (requis), price (requis), vmax, power, seats, trunk, category
          </p>
        </div>

        <div className="card p-6">
          <label className="block text-gray-400 text-sm mb-2">Collez votre JSON ici</label>
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            className="w-full bg-dark-300 border border-gray-700 rounded-lg px-4 py-3 text-white 
                       focus:border-primary-500 focus:outline-none font-mono text-sm"
            rows={15}
            placeholder="[{ ... }]"
          />

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.error ? 'bg-red-500/10 text-red-400' : 'bg-primary-500/10 text-primary-400'}`}>
              {result.error || result.message}
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !json.trim()}
            className="btn-primary w-full mt-4 disabled:opacity-50"
          >
            {loading ? 'Import en cours...' : 'Importer les véhicules'}
          </button>
        </div>
      </div>
    </div>
  )
}
