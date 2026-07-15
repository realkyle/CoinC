/**
 * @fileoverview React hook that manages historical chart data for one coin.
 *
 * Fetches and transforms raw CoinGecko price tuples whenever the selected coin
 * or day-range changes. The transformation (raw API shape → Recharts objects)
 * lives here rather than in the component, keeping the component purely
 * presentational and the data-shaping logic testable in isolation.
 *
 * Stale-request cancellation: a `cancelled` flag set in the cleanup function
 * prevents a slow in-flight response from overwriting state after the user has
 * already selected a different coin — a common async bug in React hooks.
 */

import { useState, useEffect } from "react";
import { CoinApiService } from "../services/CoinApiService";

/**
 * Fetches and transforms historical price data for a single coin.
 *
 * Returns an empty chartData array (not null) while loading so consumers
 * can render safely without null-guarding the array before use.
 *
 * @param {Object|null} coin - The currently selected coin object, or null.
 * @param {number} days - Chart lookback window in days (7 or 30).
 * @returns {{
 *   chartData: Array<{date: string, price: number}>,
 *   loading: boolean,
 *   error: string|null
 * }}
 */
export function useCoinChart(coin, days) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // No coin selected — clear state and skip the fetch.
    if (!coin) {
      setChartData([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    CoinApiService.fetchCoinChart(coin.id, days)
      .then((data) => {
        if (cancelled) return;
        setChartData(transformPricePoints(data.prices));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Returning the cleanup sets `cancelled = true`, which causes the
    // in-flight promise callbacks above to become no-ops when they resolve
    // after coin or days has changed.
    return () => {
      cancelled = true;
    };
  }, [coin?.id, days]);

  return { chartData, loading, error };
}

/**
 * Converts raw CoinGecko timestamp-price tuples into Recharts data objects.
 *
 * Recharts expects an array of plain objects with named keys; CoinGecko
 * returns an array of [timestamp_ms, value] pairs. This function bridges
 * the two shapes and is kept private to this module (information hiding).
 *
 * @param {Array<[number, number]>} pricePoints - Raw [timestamp_ms, price] pairs.
 * @returns {Array<{date: string, price: number}>} Recharts-compatible data array.
 */
function transformPricePoints(pricePoints) {
  return pricePoints.map(([timestamp, price]) => ({
    date: new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    price,
  }));
}
