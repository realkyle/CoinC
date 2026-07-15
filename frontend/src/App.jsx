/**
 * @fileoverview Root application component.
 *
 * App is a thin orchestration layer: it composes the useCoinMarkets hook and
 * the presentational components (PriceTicker, CoinChart) without containing
 * any business logic itself. The only state managed here is selectedCoin,
 * which must live at this level because it is shared between PriceTicker
 * (highlights the selected row) and CoinChart (determines what to render).
 */

import { useState, useEffect } from "react";
import { useCoinMarkets } from "./hooks/useCoinMarkets";
import PriceTicker from "./components/PriceTicker";
import CoinChart from "./components/CoinChart";

/**
 * Root component that wires together market data, chart selection, and layout.
 *
 * @returns {JSX.Element}
 */
export default function App() {
  const { coins, loading, error, lastUpdated } = useCoinMarkets();
  const [selectedCoin, setSelectedCoin] = useState(null);

  // When the polling interval delivers fresh prices, update the selected coin
  // object so the chart header always shows the current price — not the stale
  // snapshot from when the user first clicked the row.
  useEffect(() => {
    if (!selectedCoin) return;
    const refreshed = coins.find((c) => c.id === selectedCoin.id);
    if (refreshed) setSelectedCoin(refreshed);
  }, [coins]);

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100 px-4 py-8 max-w-5xl mx-auto">
      <AppHeader lastUpdated={lastUpdated} />
      <CoinChart coin={selectedCoin} onClose={() => setSelectedCoin(null)} />
      <PriceTicker
        coins={coins}
        loading={loading}
        error={error}
        selectedCoin={selectedCoin}
        onSelectCoin={setSelectedCoin}
      />
    </div>
  );
}

/**
 * Renders the application title bar and last-updated timestamp.
 *
 * Extracted from App so App's JSX stays at a single level of abstraction
 * and the header can be styled or replaced independently.
 *
 * @param {object}    props
 * @param {Date|null} props.lastUpdated - Timestamp of the most recent successful fetch,
 *                                       or null before the first fetch completes.
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
