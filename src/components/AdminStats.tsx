'use client'

import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'

interface StatsData {
  chartData: { date: string; views: number; visitors: number }[]
  topPages: { path: string; count: number; title: string }[]
  totals: {
    today: { views: number; visitors: number }
    week: { views: number; visitors: number }
    month: { views: number; visitors: number }
  }
}

export default function AdminStats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/analytics/stats')
      .then(res => res.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err)
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="text-gray-500 animate-pulse">Chargement des statistiques...</div>
  if (!data || !data.totals) return (
    <div className="card p-6 border-red-500/20 text-red-400 text-sm">
      Impossible de charger les statistiques. Vérifiez que la table <code className="bg-red-500/10 px-1 rounded">PageVisit</code> existe dans la base de données.
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Cards de visite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 border-primary-500/20">
          <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Aujourd'hui</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-white">{data.totals.today.visitors}</span>
            <span className="text-gray-500 text-xs">visiteurs</span>
          </div>
          <div className="text-primary-400 text-xs mt-1">{data.totals.today.views} vues de pages</div>
        </div>
        <div className="card p-6 border-blue-500/20">
          <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">7 derniers jours</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-white">{data.totals.week.visitors}</span>
            <span className="text-gray-500 text-xs">visiteurs</span>
          </div>
          <div className="text-blue-400 text-xs mt-1">{data.totals.week.views} vues de pages</div>
        </div>
        <div className="card p-6 border-purple-500/20">
          <div className="text-gray-400 text-xs mb-1 uppercase tracking-wider">30 derniers jours</div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-white">{data.totals.month.visitors}</span>
            <span className="text-gray-500 text-xs">visiteurs</span>
          </div>
          <div className="text-purple-400 text-xs mt-1">{data.totals.month.views} vues de pages</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Graphique d'évolution */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="text-primary-400">📈</span> Évolution des visites
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  tickFormatter={(str) => str.split('-').slice(1).reverse().join('/')}
                  fontSize={10}
                />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333' }}
                  itemStyle={{ color: '#a855f7' }}
                  labelStyle={{ color: '#666' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  name="Vues de pages"
                  stroke="#a855f7" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#a855f7' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visitors" 
                  name="Visiteurs uniques"
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Pages */}
        <div className="card p-6">
          <h3 className="font-display text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <span className="text-primary-400">🔥</span> Pages les plus vues
          </h3>
          <div className="space-y-4">
            {data.topPages.map((page, i) => (
              <div key={page.path} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 font-mono text-sm w-4">{i + 1}</span>
                  <span className="text-gray-300 text-sm truncate max-w-[250px] group-hover:text-primary-400 transition-colors" title={page.path}>
                    {page.title}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-1.5 w-24 bg-dark-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-500 rounded-full" 
                      style={{ width: `${(page.count / data.topPages[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-bold text-sm min-w-[30px] text-right">{page.count}</span>
                </div>
              </div>
            ))}
            {data.topPages.length === 0 && (
              <p className="text-gray-500 text-center py-8">Aucune donnée de visite pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
