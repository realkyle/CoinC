/**
 * @fileoverview React hook that owns portfolio holdings state.
 *
 * A "holding" is a {coinId, quantity} pair entered manually by the user.
 * This hook stores and mutates those pairs; computing USD values is
 * deliberately left to the consumer (it requires live coin prices, which
 * are owned by useCoinMarkets, not here — separation of concerns).
 *
 * Adding the same coin twice updates its quantity rather than creating a
 * duplicate row, matching the mental model of "I own X of this coin."
 */

import { useState, useCallback } from "react";

/**
 * @typedef {object} Holding
 * @property {string} coinId   - CoinGecko coin ID (e.g. "bitcoin").
 * @property {number} quantity - Number of units held (must be > 0).
 */

/**
 * Manages the user's manual portfolio holdings.
 *
 * @returns {{
 *   holdings: Holding[],
 *   addHolding: function(string, number): void,
 *   removeHolding: function(string): void
 * }}
 */
export function usePortfolio() {
  const [holdings, setHoldings] = useState([]);

  /**
   * Adds a new holding or updates the quantity if the coin already exists.
   *
   * Updating in place (rather than appending a duplicate) keeps the holdings
   * list clean — a user who re-enters a coin is correcting their quantity,
   * not adding a second position.
   *
   * @param {string} coinId   - CoinGecko coin ID to add or update.
   * @param {number} quantity - Number of units held; must be > 0.
   */
  const addHolding = useCallback((coinId, quantity) => {
    if (!coinId || quantity <= 0) return;
    setHoldings((prev) => {
      const alreadyHeld = prev.some((h) => h.coinId === coinId);
      if (alreadyHeld) {
        return prev.map((h) =>
          h.coinId === coinId ? { ...h, quantity } : h
        );
      }
      return [...prev, { coinId, quantity }];
    });
  }, []);

  /**
   * Removes the holding for the given coin, if it exists.
   *
   * @param {string} coinId - CoinGecko coin ID to remove.
   */
  const removeHolding = useCallback((coinId) => {
    setHoldings((prev) => prev.filter((h) => h.coinId !== coinId));
  }, []);

  return { holdings, addHolding, removeHolding };
}
