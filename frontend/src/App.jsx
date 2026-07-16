/**
 * @fileoverview Root application component.
 *
 * App is a thin orchestration layer: it composes hooks (useCoinMarkets,
 * useWatchlist, usePortfolio) and presentational components without containing
 * any business logic itself. Shared state lives here as the lowest common
 * ancestor of the components that need it.
 */

import { useState, useEffect } from "react";
import { useCoinMarkets } from "./hooks/useCoinMarkets";
import { useWatchlist } from "./hooks/useWatchlist";
import { usePortfolio } from "./hooks/usePortfolio";
import PriceTicker from "./components/PriceTicker";
import CoinChart from "./components/CoinChart";
import Watchlist from "./components/Watchlist";
import Portfolio from "./components/Portfolio";

/**
 * Root component that wires together market data, chart selection,
 * watchlist state, portfolio state, and layout.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  const { coins, loading, error, lastUpdated } = useCoinMarkets();
  const { watchedIds, toggleWatchlist, isWatched } = useWatchlist();
  const { holdings, addHolding, removeHolding } = usePortfolio();
  const [selectedCoin, setSelectedCoin] = useState(null);

  // Keep the selected coin's price current as the polling interval refreshes.
  useEffect(() => {
    if (!selectedCoin) return;
    const refreshed = coins.find((c) => c.id === selectedCoin.id);
    if (refreshed) setSelectedCoin(refreshed);
  }, [coins]);

  const watchedCoins = coins.filter((c) => watchedIds.has(c.id));

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-8 pb-24 max-w-5xl mx-auto">
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

      {/* Only render Portfolio once coin data is available for the dropdown */}
      {!loading && coins.length > 0 && (
        <Portfolio
          coins={coins}
          holdings={holdings}
          onAdd={addHolding}
          onRemove={removeHolding}
        />
      )}
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
