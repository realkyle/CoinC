/**
 * @fileoverview React hook that owns watchlist state.
 *
 * Encapsulates the Set of watched coin IDs and the toggle logic so that
 * components never manipulate the Set directly (information hiding).
 * A Set is used internally because membership checks are O(1) — important
 * when isWatched() is called once per row on every render of PriceTicker.
 *
 * State is local for MVP (no persistence). If localStorage or a backend
 * is added later, only this hook needs to change — components are unaffected.
 */

import { useState, useCallback } from "react";

/**
 * Manages the user's coin watchlist as a Set of CoinGecko coin IDs.
 *
 * @returns {{
 *   watchedIds: Set<string>,
 *   toggleWatchlist: function(string): void,
 *   isWatched: function(string): boolean
 * }}
 */
export function useWatchlist() {
  const [watchedIds, setWatchedIds] = useState(new Set());

  /**
   * Adds the coin to the watchlist if absent; removes it if already present.
   *
   * Always creates a new Set so React detects the state change and re-renders.
   * Mutating the existing Set in place would not trigger a re-render.
   *
   * @param {string} coinId - CoinGecko coin ID to toggle (e.g. "bitcoin").
   */
  const toggleWatchlist = useCallback((coinId) => {
    setWatchedIds((prev) => {
      const next = new Set(prev);
      if (next.has(coinId)) {
        next.delete(coinId);
      } else {
        next.add(coinId);
      }
      return next;
    });
  }, []);

  /**
   * Returns true if the given coin ID is currently in the watchlist.
   *
   * @param {string} coinId - CoinGecko coin ID to check.
   * @returns {boolean}
   */
  const isWatched = useCallback(
    (coinId) => watchedIds.has(coinId),
    [watchedIds]
  );

  return { watchedIds, toggleWatchlist, isWatched };
}
