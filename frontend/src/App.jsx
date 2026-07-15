import { useState, useEffect } from 'react'
import PriceTicker from './components/PriceTicker'

const REFRESH_INTERVAL_MS = 60_000

export default function App() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  async function fetchMarkets() {
    try {
      const res = await fetch('/api/markets')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCoins(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarkets()
    const id = setInterval(fetchMarkets, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          CoinPulse
        </h1>
        <p className="text-gray-400 mt-1 text-sm">
          Live crypto prices &amp; portfolio tracker
        </p>
        {lastUpdated && (
          <p className="text-gray-600 text-xs mt-1">
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </header>

      <PriceTicker coins={coins} loading={loading} error={error} />
    </div>
  )
}
