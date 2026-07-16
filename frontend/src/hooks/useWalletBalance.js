/**
 * @fileoverview React hook that manages the wallet balance lookup lifecycle.
 *
 * Encapsulates all fetch state (loading, error, result) for the one-shot
 * Etherscan lookup triggered when the user submits a wallet address.
 * The hook does not poll — the user initiates each lookup explicitly.
 */

import { useState, useCallback } from "react";
import { CoinApiService } from "../services/CoinApiService";

/**
 * @typedef {object} WalletBalance
 * @property {string} address - The queried Ethereum address.
 * @property {number} eth     - Balance in ETH.
 */

/**
 * Manages the state for a one-shot wallet balance lookup.
 *
 * Keeps `balance` null until a successful lookup so the UI can
 * distinguish "never searched" from "searched and got zero."
 *
 * @returns {{
 *   balance: WalletBalance|null,
 *   loading: boolean,
 *   error: string|null,
 *   lookup: function(string): void
 * }}
 */
export function useWalletBalance() {
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch the ETH balance for the given address.
   * Clears any previous result and error before starting.
   *
   * @param {string} address - Ethereum wallet address to look up.
   */
  const lookup = useCallback(async (address) => {
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const data = await CoinApiService.fetchWalletBalance(address);
      setBalance(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { balance, loading, error, lookup };
}
