import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

export default function CoinChart({ coin, onClose }) {
  const [days, setDays] = useState(7)
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!coin) return
    setLoading(true)
    setError(null)
    fetch(`/api/coins/${coin.id}/chart?days=${days}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setChartData(
          data.prices.map(([ts, price]) => ({
            date: new Date(ts).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            price,
          }))
        )
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [coin, days])

  if (!coin) return null

  const priceMin = Math.min(...chartData.map((d) => d.price))
  const priceMax = Math.max(...chartData.map((d) => d.price))
  const isUp =
    chartData.length >= 2 &&
    chartData[chartData.length - 1].price >= chartData[0].price
  const accentColor = isUp ? '#4ade80' : '#f87171'

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" />
          <div>
            <h2 className="text-white font-semibold text-lg leading-none">
              {coin.name}
            </h2>
            <span className="text-gray-500 text-xs uppercase">{coin.symbol}</span>
          </div>
          <span className="text-white font-mono text-lg ml-2">
            {formatPrice(coin.current_price)}
          </span>
          <span
            className={`text-sm font-medium ${
              coin.price_change_percentage_24h >= 0
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {coin.price_change_percentage_24h >= 0 ? '+' : ''}
            {coin.price_change_percentage_24h?.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {d}d
            </button>
          ))}
          <button
            onClick={onClose}
            className="ml-3 text-gray-500 hover:text-white text-xl leading-none"
            aria-label="Close chart"
          >
            ×
          </button>
        </div>
      </div>

      {/* Chart body */}
      {loading && (
        <div className="h-56 flex items-center justify-center text-gray-500">
          Loading chart…
        </div>
      )}
      {error && (
        <div className="h-56 flex items-center justify-center text-red-400">
          {error}
        </div>
      )}
      {!loading && !error && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={accentColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[priceMin * 0.995, priceMax * 1.005]}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatPrice}
              width={72}
            />
            <Tooltip
              contentStyle={{
                background: '#111827',
                border: '1px solid #374151',
                borderRadius: 8,
                color: '#f3f4f6',
                fontSize: 13,
              }}
              formatter={(v) => [formatPrice(v), 'Price']}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={false}
              activeDot={{ r: 4, fill: accentColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

function formatPrice(price) {
  if (price >= 1000)
    return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 })
  if (price >= 1)
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}
