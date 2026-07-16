/**
 * @fileoverview Root application component.
 *
 * App is a thin orchestration layer: it composes hooks (useCoinMarkets,
 * useWatchlist) and presentational components (PriceTicker, CoinChart,
 * Watchlist) without containing any business logic itself.
 *
 * Shared state that spans multiple components lives here as the lowest
 * common ancestor — selectedCoin is shared by PriceTicker, CoinChart, and
 * Watchlist; watchedIds is shared by PriceTicker and Watchlist.
 */

import { useState, useEffect } from "react";
import { useCoinMarkets } from "./hooks/useCoinMarkets";
import { useWatchlist } from "./hooks/useWatchlist";
import PriceTicker from "./components/PriceTicker";
import CoinChart from "./components/CoinChart";
import Watchlist from "./components/Watchlist";

/**
 * Root component that wires together market data, chart selection,
 * watchlist state, and layout.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  const { coins, loading, error, lastUpdated } = useCoinMarkets();
  const { watchedIds, toggleWatchlist, isWatched } = useWatchlist();
  const [selectedCoin, setSelectedCoin] = useState(null);

  // When the polling interval delivers fresh prices, keep the selected coin
  // object current so the chart header always shows the latest price.
  useEffect(() => {
    if (!selectedCoin) return;
    const refreshed = coins.find((c) => c.id === selectedCoin.id);
    if (refreshed) setSelectedCoin(refreshed);
  }, [coins]);

  // Derive the watched coin objects from the full coins array on each render.
  // This keeps Watchlist in sync with live prices without extra state.
  const watchedCoins = coins.filter((c) => watchedIds.has(c.id));

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-8 max-w-5xl mx-auto">
      <AppHeader lastUpdated={lastUpdated} />

      <Watchlist
        watchedCoins={watchedCoins}
        onRemove={toggleWatchlist}
        onSelectCoin={setSelectedCoin}
        selectedCoin={selectedCoin}
      />

      <CoinChart coin={selectedCoin} onClose={() => setSelectedCoin(null)} />

      <PriceTicker
        coins={coins}
        loading={loading}
        error={error}
        selectedCoin={selectedCoin}
        onSelectCoin={setSelectedCoin}
        isWatched={isWatched}
        onToggleWatch={toggleWatchlist}
      />
    </div>
  );
}

/**
 * Renders the application title bar and last-updated timestamp.
 *
 * @param {object}    props
 * @param {Date|null} props.lastUpdated - Timestamp of the most recent successful
 *                                       fetch, or null before first fetch completes.
 * @returns {JSX.Element}
 */
function AppHeader({ lastUpdated }) {
  return (
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
  );
}
