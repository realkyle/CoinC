/**
 * @fileoverview Formatting utilities for prices and large financial numbers.
 *
 * Extracting formatting into a dedicated utility class (SRP) prevents the
 * same formatting math from being duplicated in PriceTicker, CoinChart, and
 * future components. All methods are static because formatting is pure,
 * stateless computation — input in, string out.
 *
 * The private constructor prevents accidental instantiation and signals to
 * readers that this class is a namespace for static utilities, not a type
 * to be composed or extended.
 */

export class PriceFormatter {
  /**
   * Private constructor — PriceFormatter must not be instantiated.
   * All interaction occurs through static methods.
   *
   * @throws {Error} Always, to enforce static-only usage.
   */
  constructor() {
    throw new Error(
      "PriceFormatter is a static utility class and cannot be instantiated."
    );
  }

  /**
   * Formats a coin price in USD with precision scaled to magnitude.
   *
   * Rationale for tiers:
   *   - ≥ $1 000 : no decimals (BTC at $65 000 — cents are noise)
   *   - ≥ $1    : two decimals (ETH at $1 924.10 — standard currency display)
   *   - < $1    : four to six sig-figs (DOGE at $0.0739 — decimals carry meaning)
   *
   * @param {number} price - Raw price in USD.
   * @returns {string} Formatted string e.g. "$65,000", "$1,924.10", "$0.073996".
   */
  static formatPrice(price) {
    if (price >= 1_000) {
      return "$" + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
    }
    if (price >= 1) {
      return (
        "$" +
        price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
    return (
      "$" +
      price.toLocaleString("en-US", {
        minimumFractionDigits: 4,
        maximumFractionDigits: 6,
      })
    );
  }

  /**
   * Formats a large financial value with T / B / M suffix for readability.
   *
   * Used for market-cap and 24-hour volume columns where full numbers
   * ($1,300,000,000,000) would overflow the table cell.
   *
   * @param {number} value - Raw numeric value in USD.
   * @returns {string} Abbreviated string e.g. "$1.30T", "$231.93B", "$588.67M".
   */
  static formatLargeNumber(value) {
    if (value >= 1e12) return "$" + (value / 1e12).toFixed(2) + "T";
    if (value >= 1e9) return "$" + (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return "$" + (value / 1e6).toFixed(2) + "M";
    return "$" + value.toLocaleString("en-US");
  }

  /**
   * Formats a percentage change with an explicit sign prefix.
   *
   * Always showing the sign (+/-) avoids ambiguity in tables where
   * positive and negative rows sit adjacent to each other.
   *
   * @param {number} pct - Percentage change value (e.g. 2.45 or -0.83).
   * @returns {string} Signed percentage string e.g. "+2.45%" or "-0.83%".
   */
  static formatPercentage(pct) {
    const sign = pct >= 0 ? "+" : "";
    return `${sign}${pct?.toFixed(2)}%`;
  }
}
