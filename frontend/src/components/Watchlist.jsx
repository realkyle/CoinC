/**
 * @fileoverview Watchlist component — horizontally scrollable row of watched coins.
 *
 * Purely presentational: receives the filtered watched-coin array and callbacks
 * via props. Renders nothing when the watchlist is empty so the layout does not
 * shift before the user has added any coins.
 *
 * Sub-components:
 *   WatchlistCard  — one card per watched coin.
 *   EmptyWatchlist — placeholder shown when watchedCoins is empty.
 */

import { PriceFormatter } from "../utils/PriceFormatter";

/**
 * Renders a horizontal strip of watched coin cards above the main ticker.
 *
 * @param {object}          props
 * @param {Array<Object>}   props.watchedCoins   - Coin objects currently in the watchlist.
 * @param {function}        props.onRemove       - Called with coinId when × is clicked.
 * @param {function}        props.onSelectCoin   - Called with a coin when a card is clicked.
 * @param {Object|null}     props.selectedCoin   - The currently charted coin (for highlight).
 * @returns {JSX.Element|null} Null when the watchlist is empty.
 */
export default function Watchlist({
  watchedCoins,
  onRemove,
  onSelectCoin,
  selectedCoin,
}) {
  if (watchedCoins.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Watchlist
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {watchedCoins.map((coin) => (
          <WatchlistCard
            key={coin.id}
            coin={coin}
            isSelected={selectedCoin?.id === coin.id}
            onSelect={() =>
              onSelectCoin(selectedCoin?.id === coin.id ? null : coin)
            }
            onRemove={() => onRemove(coin.id)}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Renders a compact card for a single watched coin.
 *
 * Clicking the card opens/closes its chart (same toggle behaviour as the
 * ticker rows). The × button removes the coin from the watchlist without
 * propagating the click to the card's chart-toggle handler.
 *
 * @param {object}   props
 * @param {Object}   props.coin       - CoinGecko market object.
 * @param {boolean}  props.isSelected - True when this coin's chart is open.
 * @param {function} props.onSelect   - Called when the card body is clicked.
 * @param {function} props.onRemove   - Called when × is clicked.
 * @returns {JSX.Element}
 */
function WatchlistCard({ coin, isSelected, onSelect, onRemove }) {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <div
      onClick={onSelect}
      className={`relative flex-shrink-0 w-40 rounded-xl border p-3 cursor-pointer
        transition-colors hover:border-gray-600
        ${isSelected
          ? "border-indigo-500 bg-indigo-950/40"
          : "border-gray-800 bg-gray-900"
        }`}
    >
      {/* Remove button — stopPropagation prevents triggering onSelect */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        aria-label={`Unwatch ${coin.name}`}
        className="absolute top-2 right-2 text-gray-600 hover:text-white text-sm leading-none"
      >
        ×
      </button>

      <div className="flex items-center gap-2 mb-2">
        <img
          src={coin.image}
          alt={coin.name}
          className="w-5 h-5 rounded-full"
        />
        <span className="text-white text-xs font-medium truncate">
          {coin.name}
        </span>
      </div>

      <p className="text-white font-mono text-sm font-semibold">
        {PriceFormatter.formatPrice(coin.current_price)}
      </p>

      <p
        className={`text-xs font-medium mt-0.5 ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {PriceFormatter.formatPercentage(coin.price_change_percentage_24h)}
      </p>
    </div>
  );
}
