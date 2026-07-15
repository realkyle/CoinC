/**
 * @fileoverview PriceTicker component — live coin price table.
 *
 * Purely presentational: receives all data and callbacks via props, contains
 * no internal state or side-effects. Formatting is delegated to PriceFormatter
 * (SRP) and row rendering is extracted into a CoinRow sub-component to keep
 * PriceTicker's render logic at a single level of abstraction.
 */

import { PriceFormatter } from "../utils/PriceFormatter";

/**
 * Renders a table of live coin prices with colour-coded 24-hour change column.
 *
 * @param {object}          props
 * @param {Array<Object>}   props.coins        - Array of CoinGecko market objects.
 * @param {boolean}         props.loading      - True while the initial fetch is in flight.
 * @param {string|null}     props.error        - Error message string, or null when healthy.
 * @param {Object|null}     props.selectedCoin - The coin whose chart is currently open.
 * @param {function}        props.onSelectCoin - Called with a coin (or null) on row click.
 * @returns {JSX.Element}
 */
export default function PriceTicker({
  coins,
  loading,
  error,
  selectedCoin,
  onSelectCoin,
}) {
  if (loading) {
    return (
      <div className="text-gray-400 text-center py-12">Loading prices...</div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center py-12">
        Failed to load prices: {error}
      </div>
    );
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
          {coins.map((coin) => (
            <CoinRow
              key={coin.id}
              coin={coin}
              isSelected={selectedCoin?.id === coin.id}
              onSelect={() =>
                onSelectCoin(selectedCoin?.id === coin.id ? null : coin)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders a single row in the price ticker table.
 *
 * Extracted from PriceTicker so each row's rendering concern is isolated
 * and can be memoised (React.memo) independently if performance requires it.
 *
 * @param {object}   props
 * @param {Object}   props.coin       - CoinGecko market object for this row.
 * @param {boolean}  props.isSelected - True when this coin's chart panel is open.
 * @param {function} props.onSelect   - Called when the row is clicked.
 * @returns {JSX.Element}
 */
function CoinRow({ coin, isSelected, onSelect }) {
  const change = coin.price_change_percentage_24h;
  const isPositive = change >= 0;

  return (
    <tr
      onClick={onSelect}
      className={`border-b border-gray-800 last:border-0 hover:bg-gray-800/40
        transition-colors cursor-pointer ${isSelected ? "bg-gray-800/60" : ""}`}
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
          <span className="text-gray-500 uppercase text-xs">{coin.symbol}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-right font-mono text-white">
        {PriceFormatter.formatPrice(coin.current_price)}
      </td>

      <td
        className={`px-4 py-3 text-right font-mono font-medium ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {PriceFormatter.formatPercentage(change)}
      </td>

      <td className="px-4 py-3 text-right text-gray-300 hidden sm:table-cell">
        {PriceFormatter.formatLargeNumber(coin.market_cap)}
      </td>

      <td className="px-4 py-3 text-right text-gray-300 hidden md:table-cell">
        {PriceFormatter.formatLargeNumber(coin.total_volume)}
      </td>
    </tr>
  );
}
