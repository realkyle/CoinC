/**
 * @fileoverview Portfolio component — holdings input, total value, and allocation chart.
 *
 * Purely presentational at the top level: receives live coin data and holding
 * callbacks via props. USD values are computed here by joining holdings with
 * live prices — this is view-layer math, not business logic.
 *
 * Sub-components (all private to this file):
 *   PortfolioForm    — controlled form for adding a holding.
 *   HoldingsTable    — tabular list of holdings with remove button.
 *   AllocationChart  — Recharts donut chart of portfolio allocation.
 */

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { PriceFormatter } from "../utils/PriceFormatter";

/** Color palette cycling across holdings in the donut chart. */
const CHART_COLORS = [
  "#6366f1", // indigo
  "#4ade80", // green
  "#f59e0b", // amber
  "#f87171", // red
  "#60a5fa", // blue
  "#c084fc", // purple
  "#34d399", // emerald
  "#fb923c", // orange
];

/**
 * @typedef {object} EnrichedHolding
 * @property {string} coinId
 * @property {number} quantity
 * @property {Object} coin        - Full CoinGecko market object (may be undefined if not loaded).
 * @property {number} value       - quantity × current_price in USD.
 * @property {string} color       - Assigned chart color.
 */

/**
 * Renders the full portfolio section: add form, total value, donut chart, holdings table.
 *
 * @param {object}        props
 * @param {Array<Object>} props.coins         - Live coin market objects from useCoinMarkets.
 * @param {Array<Object>} props.holdings      - Raw {coinId, quantity} pairs from usePortfolio.
 * @param {function}      props.onAdd         - Called with (coinId, quantity) on form submit.
 * @param {function}      props.onRemove      - Called with coinId when a holding is removed.
 * @returns {JSX.Element}
 */
export default function Portfolio({ coins, holdings, onAdd, onRemove }) {
  // Join holdings with live prices to produce enriched rows.
  const enriched = holdings
    .map((h, i) => {
      const coin = coins.find((c) => c.id === h.coinId);
      return {
        ...h,
        coin,
        value: coin ? coin.current_price * h.quantity : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    })
    .filter((h) => h.coin); // drop any whose coin data hasn't loaded yet

  const totalValue = enriched.reduce((sum, h) => sum + h.value, 0);

  return (
    <section className="mt-8">
      <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
        Portfolio
      </h2>

      <PortfolioForm coins={coins} holdings={holdings} onAdd={onAdd} />

      {enriched.length > 0 && (
        <div className="mt-6">
          {/* Total value banner */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">Total Value</p>
            <p className="text-white text-3xl font-bold font-mono mt-1">
              {PriceFormatter.formatPrice(totalValue)}
            </p>
          </div>

          <AllocationChart data={enriched} />

          <HoldingsTable
            enriched={enriched}
            totalValue={totalValue}
            onRemove={onRemove}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Controlled form for adding a coin + quantity holding.
 *
 * Maintains its own input state (coinId, quantityStr) because this state is
 * ephemeral and local — it has no meaning outside the form itself.
 * The form resets after a successful submission.
 *
 * @param {object}        props
 * @param {Array<Object>} props.coins    - Available coins to populate the dropdown.
 * @param {Array<Object>} props.holdings - Current holdings, used to show "Update" vs "Add".
 * @param {function}      props.onAdd   - Called with (coinId, number) on valid submit.
 * @returns {JSX.Element}
 */
function PortfolioForm({ coins, holdings, onAdd }) {
  const [coinId, setCoinId] = useState(coins[0]?.id ?? "");
  const [quantityStr, setQuantityStr] = useState("");

  const isUpdate = holdings.some((h) => h.coinId === coinId);

  function handleSubmit(e) {
    e.preventDefault();
    const quantity = parseFloat(quantityStr);
    if (!coinId || isNaN(quantity) || quantity <= 0) return;
    onAdd(coinId, quantity);
    setQuantityStr("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3"
    >
      <select
        value={coinId}
        onChange={(e) => setCoinId(e.target.value)}
        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2
          text-sm focus:outline-none focus:border-indigo-500 flex-1"
      >
        {coins.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.symbol.toUpperCase()})
          </option>
        ))}
      </select>

      <input
        type="number"
        min="0"
        step="any"
        placeholder="Quantity"
        value={quantityStr}
        onChange={(e) => setQuantityStr(e.target.value)}
        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2
          text-sm focus:outline-none focus:border-indigo-500 w-36 placeholder-gray-600"
      />

      <button
        type="submit"
        className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-5 py-2
          text-sm font-medium transition-colors"
      >
        {isUpdate ? "Update" : "Add"}
      </button>
    </form>
  );
}

/**
 * Renders a table of enriched holdings with coin, quantity, value, allocation %, and remove button.
 *
 * @param {object}              props
 * @param {EnrichedHolding[]}  props.enriched    - Computed holdings with USD values and colors.
 * @param {number}              props.totalValue  - Sum of all holding values (for % calculation).
 * @param {function}            props.onRemove    - Called with coinId when × is clicked.
 * @returns {JSX.Element}
 */
function HoldingsTable({ enriched, totalValue, onRemove }) {
  return (
    <div className="rounded-xl border border-gray-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-800 text-left">
            <th className="px-4 py-3 font-medium">Coin</th>
            <th className="px-4 py-3 font-medium text-right">Qty</th>
            <th className="px-4 py-3 font-medium text-right">Value</th>
            <th className="px-4 py-3 font-medium text-right">Alloc</th>
            <th className="px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {enriched.map((h) => (
            <tr
              key={h.coinId}
              className="border-b border-gray-800 last:border-0 hover:bg-gray-800/30"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {/* Color swatch matches the donut slice */}
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: h.color }}
                  />
                  <img
                    src={h.coin.image}
                    alt={h.coin.name}
                    className="w-5 h-5 rounded-full"
                  />
                  <span className="text-white font-medium">{h.coin.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-right text-gray-300 font-mono">
                {h.quantity.toLocaleString("en-US", { maximumFractionDigits: 8 })}
              </td>
              <td className="px-4 py-3 text-right text-white font-mono">
                {PriceFormatter.formatPrice(h.value)}
              </td>
              <td className="px-4 py-3 text-right text-gray-400">
                {totalValue > 0
                  ? ((h.value / totalValue) * 100).toFixed(1) + "%"
                  : "—"}
              </td>
              <td className="px-2 py-3 text-center">
                <button
                  onClick={() => onRemove(h.coinId)}
                  aria-label={`Remove ${h.coin.name} from portfolio`}
                  className="text-gray-600 hover:text-red-400 transition-colors text-base leading-none"
                >
                  ×
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders a Recharts donut (PieChart with innerRadius) for portfolio allocation.
 *
 * Uses explicit pixel dimensions instead of ResponsiveContainer because the
 * chart lives inside a flex child whose percentage width resolves ambiguously
 * during initial layout, causing ResponsiveContainer to compute zero dimensions.
 * Isolated so the chart library can be swapped without touching Portfolio (OCP).
 *
 * @param {object}             props
 * @param {EnrichedHolding[]}  props.data - Enriched holdings with value and color.
 * @returns {JSX.Element}
 */
function AllocationChart({ data }) {
  // Include fill in each datum so Recharts can color slices without Cell.
  const pieData = data.map((h) => ({
    name: h.coin.name,
    value: h.value,
    fill: h.color,
  }));

  return (
    <div className="flex justify-center mb-6">
      <PieChart width={300} height={300}>
        <Pie
          data={pieData}
          cx={150}
          cy={150}
          innerRadius={75}
          outerRadius={115}
          paddingAngle={2}
          dataKey="value"
          isAnimationActive={false}
        >
          {pieData.map((entry) => (
            <Cell key={entry.name} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: 8,
            color: "#f3f4f6",
            fontSize: 13,
          }}
          formatter={(value) => [PriceFormatter.formatPrice(value), "Value"]}
        />
      </PieChart>
    </div>
  );
}
