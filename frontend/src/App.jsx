import { useState, useEffect } from 'react'
import PriceTicker from './components/PriceTicker'
import CoinChart from './components/CoinChart'

const REFRESH_INTERVAL_MS = 60_000

export default function App() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedCoin, setSelectedCoin] = useState(null)

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

  // Keep selectedCoin data fresh when prices refresh
  useEffect(() => {
    if (!selectedCoin) return
    const updated = coins.find((c) => c.id === selectedCoin.id)
    if (updated) setSelectedCoin(updated)
  }, [coins])

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

      <CoinChart
        coin={selectedCoin}
        onClose={() => setSelectedCoin(null)}
      />

      <PriceTicker
        coins={coins}
        loading={loading}
        error={error}
        selectedCoin={selectedCoin}
        onSelectCoin={setSelectedCoin}
      />
    </div>
  )
}
