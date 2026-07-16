/**
 * @fileoverview WalletView component — read-only Ethereum wallet balance lookup.
 *
 * The user pastes any public Ethereum address and submits. The component
 * fetches the ETH balance via the backend and displays it with USD value
 * computed from the live ETH price already in the app.
 *
 * Sub-components (all private to this file):
 *   WalletForm    — address input and submit button.
 *   BalanceResult — ETH balance + USD value display.
 */

import { useState } from "react";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { PriceFormatter } from "../utils/PriceFormatter";

/**
 * Root wallet lookup section.
 *
 * @param {object} props
 * @param {number|null} props.ethPriceUsd - Live ETH/USD price from useCoinMarkets;
 *                                          null before the first fetch completes.
 * @returns {JSX.Element}
 */
export default function WalletView({ ethPriceUsd }) {
  const { balance, loading, error, lookup } = useWalletBalance();

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
        Wallet Lookup
      </h2>

      <WalletForm onSubmit={lookup} loading={loading} />

      {error && (
        <p className="mt-3 text-sm text-red-400">{error}</p>
      )}

      {balance && (
        <BalanceResult balance={balance} ethPriceUsd={ethPriceUsd} />
      )}
    </section>
  );
}

/**
 * Controlled address input form.
 *
 * Maintains its own `address` string state — ephemeral input value that has
 * no meaning outside this form, so it stays local (information hiding).
 *
 * @param {object}   props
 * @param {function} props.onSubmit - Called with the trimmed address string.
 * @param {boolean}  props.loading  - True while a lookup is in flight.
 * @returns {JSX.Element}
 */
function WalletForm({ onSubmit, loading }) {
  const [address, setAddress] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = address.trim();
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="0x... Ethereum address"
        aria-label="Ethereum wallet address"
        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2
          text-sm focus:outline-none focus:border-indigo-500 flex-1 font-mono
          placeholder-gray-600"
      />
      <button
        type="submit"
        disabled={loading || !address.trim()}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40
          disabled:cursor-not-allowed text-white rounded-lg px-5 py-2
          text-sm font-medium transition-colors"
      >
        {loading ? "Looking up…" : "Look up"}
      </button>
    </form>
  );
}

/**
 * Displays the ETH balance and its USD equivalent.
 *
 * @param {object}          props
 * @param {{address:string, eth:number}} props.balance     - Result from the hook.
 * @param {number|null}     props.ethPriceUsd - Live ETH price for USD conversion.
 * @returns {JSX.Element}
 */
function BalanceResult({ balance, ethPriceUsd }) {
  const usdValue = ethPriceUsd != null ? balance.eth * ethPriceUsd : null;

  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-4">
      {/* Truncated address display */}
      <p className="text-gray-400 text-xs font-mono mb-3 truncate">
        {balance.address}
      </p>

      <div className="flex items-end gap-4">
        <div>
          <p className="text-gray-400 text-sm">ETH Balance</p>
          <p className="text-white text-2xl font-bold font-mono mt-0.5">
            {balance.eth.toLocaleString("en-US", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 8,
            })}{" "}
            <span className="text-gray-400 text-base font-normal">ETH</span>
          </p>
        </div>

        {usdValue != null && (
          <div className="mb-0.5">
            <p className="text-gray-400 text-sm">≈ USD value</p>
            <p className="text-gray-300 text-lg font-mono mt-0.5">
              {PriceFormatter.formatPrice(usdValue)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
