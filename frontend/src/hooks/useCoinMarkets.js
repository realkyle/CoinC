/**
 * @fileoverview React hook that owns market-data state for the price ticker.
 *
 * Encapsulates the full fetch lifecycle — loading flag, error message, coin
 * array, last-updated timestamp, and the polling interval — so that components
 * receive clean state without managing timers or side-effects directly.
 *
 * This is React's idiomatic equivalent of a stateful repository/service class:
 * state is hidden inside the hook (encapsulation) and components interact only
 * through the returned value object (information hiding).
 */

import { useState, useEffect, useCallback } from "react";
import { CoinApiService } from "../services/CoinApiService";

/** Polling interval matches the CoinGecko free-tier cache TTL of 60 seconds. */
const REFRESH_INTERVAL_MS = 60_000;

/**
 * Fetches and periodically refreshes live market data for all tracked coins.
 *
 * The interval is cleared automatically when the consuming component unmounts,
 * preventing memory leaks and stale-closure updates on unmounted components.
 *
 * @returns {{
 *   coins: Array<Object>,
 *   loading: boolean,
 *   error: string|null,
 *   lastUpdated: Date|null
 * }} Current market state consumed by PriceTicker and App.
 */
export function useCoinMarkets() {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  /**
   * Fetches fresh market data from the API service and updates local state.
   * Wrapped in useCallback so the stable reference can be used safely in the
   * useEffect dependency array without triggering infinite re-render loops.
   */
  const fetchMarkets = useCallback(async () => {
    try {
      const data = await CoinApiService.fetchMarkets();
      setCoins(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const intervalId = setInterval(fetchMarkets, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchMarkets]);

  return { coins, loading, error, lastUpdated };
}
