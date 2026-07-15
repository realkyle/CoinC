/**
 * @fileoverview CoinChart component — historical price chart panel.
 *
 * Presentational orchestrator: delegates data fetching to useCoinChart,
 * formatting to PriceFormatter, and rendering sub-concerns to ChartHeader
 * and PriceAreaChart sub-components. CoinChart itself only decides layout
 * and whether to show loading/error/chart states (SRP at the component level).
 *
 * The chart library (Recharts) is isolated inside PriceAreaChart — swapping
 * it for another library requires only touching that one sub-component (OCP).
 */

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { useCoinChart } from "../hooks/useCoinChart";
import { PriceFormatter } from "../utils/PriceFormatter";

/** Day-range options surfaced in the toggle buttons. */
const DAY_OPTIONS = [7, 30];

/**
 * Renders a collapsible price chart panel for the currently selected coin.
 *
 * Returns null when no coin is selected, so the panel takes up no space
 * in the layout until the user makes a selection.
 *
 * @param {object}        props
 * @param {Object|null}   props.coin    - The selected coin, or null to hide the panel.
 * @param {function}      props.onClose - Called when the user clicks the close button.
 * @returns {JSX.Element|null}
 */
export default function CoinChart({ coin, onClose }) {
  const [days, setDays] = useState(7);
  const { chartData, loading, error } = useCoinChart(coin, days);

  if (!coin) return null;

  // Determine trend direction so the chart colour matches the price movement.
  const isUp =
    chartData.length >= 2 &&
    chartData[chartData.length - 1].price >= chartData[0].price;
  const accentColor = isUp ? "#4ade80" : "#f87171";

  const priceMin = chartData.length ? Math.min(...chartData.map((d) => d.price)) : 0;
  const priceMax = chartData.length ? Math.max(...chartData.map((d) => d.price)) : 0;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
      <ChartHeader
        coin={coin}
        days={days}
        onDaysChange={setDays}
        onClose={onClose}
      />

      {loading && (
        <div className="h-56 flex items-center justify-center text-gray-500">
          Loading chart…
        </div>
      )}

      {error && (
        <div className="h-56 flex items-center justify-center text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && (
        <PriceAreaChart
          data={chartData}
          accentColor={accentColor}
          priceMin={priceMin}
          priceMax={priceMax}
        />
      )}
    </div>
  );
}

/**
 * Renders the chart panel header: coin identity, live price, 24h change,
 * day-range toggle buttons, and the close button.
 *
 * Extracted from CoinChart to keep the parent component at one level of
 * abstraction — CoinChart decides *what* to show, ChartHeader decides *how*
 * to lay out the header row.
 *
 * @param {object}   props
 * @param {Object}   props.coin          - Selected coin market object.
 * @param {number}   props.days          - Currently active day range.
 * @param {function} props.onDaysChange  - Called with the new day count on toggle.
 * @param {function} props.onClose       - Called when the × button is clicked.
 * @returns {JSX.Element}
 */
function ChartHeader({ coin, days, onDaysChange, onClose }) {
  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <img
          src={coin.image}
          alt={coin.name}
          className="w-7 h-7 rounded-full"
        />
        <div>
          <h2 className="text-white font-semibold text-lg leading-none">
            {coin.name}
          </h2>
          <span className="text-gray-500 text-xs uppercase">{coin.symbol}</span>
        </div>
        <span className="text-white font-mono text-lg ml-2">
          {PriceFormatter.formatPrice(coin.current_price)}
        </span>
        <span
          className={`text-sm font-medium ${
            isPositive ? "text-green-400" : "text-red-400"
          }`}
        >
          {PriceFormatter.formatPercentage(coin.price_change_percentage_24h)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {DAY_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => onDaysChange(d)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              days === d
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {d}d
          </button>
        ))}
        <button
          onClick={onClose}
          aria-label="Close chart"
          className="ml-3 text-gray-500 hover:text-white text-xl leading-none"
        >
          ×
        </button>
      </div>
    </div>
  );
}

/**
 * Renders the Recharts AreaChart with gradient fill, styled axes, and tooltip.
 *
 * Isolated in its own sub-component so the chart library can be swapped
 * (e.g. Chart.js, Victory) without touching CoinChart's layout or state (OCP).
 *
 * @param {object}                          props
 * @param {Array<{date:string,price:number}>} props.data        - Recharts data array.
 * @param {string}                          props.accentColor  - Hex color for stroke/fill.
 * @param {number}                          props.priceMin     - Raw min price for Y domain.
 * @param {number}                          props.priceMax     - Raw max price for Y domain.
 * @returns {JSX.Element}
 */
function PriceAreaChart({ data, accentColor, priceMin, priceMax }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={accentColor} stopOpacity={0.25} />
            <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#1f2937"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <YAxis
          domain={[priceMin * 0.995, priceMax * 1.005]}
          tick={{ fill: "#6b7280", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={PriceFormatter.formatPrice}
          width={72}
        />

        <Tooltip
          contentStyle={{
            background: "#111827",
            border: "1px solid #374151",
            borderRadius: 8,
            color: "#f3f4f6",
            fontSize: 13,
          }}
          formatter={(value) => [PriceFormatter.formatPrice(value), "Price"]}
          labelStyle={{ color: "#9ca3af" }}
        />

        <Area
          type="monotone"
          dataKey="price"
          stroke={accentColor}
          strokeWidth={2}
          fill="url(#priceGrad)"
          dot={false}
          activeDot={{ r: 4, fill: accentColor }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
