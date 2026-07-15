export default function PriceTicker({ coins, loading, error }) {
  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Loading prices...</div>
    )
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-12">
        Failed to load prices: {error}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-800 text-left">
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Coin</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">24h %</th>
            <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">
              Market Cap
            </th>
            <th className="px-4 py-3 font-medium text-right hidden md:table-cell">
              Volume (24h)
            </th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin) => {
            const change = coin.price_change_percentage_24h
            const isPositive = change >= 0

            return (
              <tr
                key={coin.id}
                className="border-b border-gray-800 last:border-0 hover:bg-gray-800/40 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-500">{coin.market_cap_rank}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-6 h-6 rounded-full"
                    />
                    <span className="font-medium text-white">{coin.name}</span>
                    <span className="text-gray-500 uppercase text-xs">
                      {coin.symbol}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-white">
                  {formatPrice(coin.current_price)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono font-medium ${
                    isPositive ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {isPositive ? '+' : ''}
                  {change?.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right text-gray-300 hidden sm:table-cell">
                  {formatLarge(coin.market_cap)}
                </td>
                <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">
                  {formatLarge(coin.total_volume)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function formatPrice(price) {
  if (price >= 1) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 })
}

function formatLarge(n) {
  if (n >= 1e12) return '$' + (n / 1e12).toFixed(2) + 'T'
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B'
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M'
  return '$' + n.toLocaleString()
}
