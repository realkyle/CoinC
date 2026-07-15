/**
 * @fileoverview HTTP service layer for the CoinPulse frontend.
 *
 * CoinApiService is the single point of contact between React components/hooks
 * and the FastAPI backend. Centralising all fetch() calls here means:
 *   - URL paths never scatter across components.
 *   - HTTP error handling is normalised in one place.
 *   - Tests mock this class rather than the global fetch API.
 *
 * All methods are static because the service is stateless — it transforms
 * arguments into requests and responses into data, nothing more (SRP).
 * The private constructor prevents accidental instantiation.
 */

/** Base path that Vite proxies to http://localhost:8000 in development. */
const API_BASE = "/api";

export class CoinApiService {
  /**
   * Private constructor — CoinApiService must not be instantiated.
   * All interaction occurs through static methods.
   *
   * @throws {Error} Always, to enforce static-only usage.
   */
  constructor() {
    throw new Error(
      "CoinApiService is a static utility class and cannot be instantiated."
    );
  }

  /**
   * Fetches live market data for all coins tracked by the backend.
   *
   * Maps to GET /api/markets on the backend proxy.
   *
   * @param {string} [vsCurrency="usd"] - ISO 4217 currency code for prices.
   * @returns {Promise<CoinMarket[]>} Resolves with an array of market-data objects.
   * @throws {Error} If the HTTP response is not 2xx.
   */
  static async fetchMarkets(vsCurrency = "usd") {
    const response = await fetch(`${API_BASE}/markets?vs_currency=${vsCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch markets: HTTP ${response.status}`);
    }
    return response.json();
  }

  /**
   * Fetches historical price data for a single coin.
   *
   * Maps to GET /api/coins/{coinId}/chart on the backend proxy.
   *
   * @param {string} coinId - CoinGecko coin ID (e.g. "bitcoin").
   * @param {number} [days=7] - Number of past days to retrieve (1–365).
   * @param {string} [vsCurrency="usd"] - ISO 4217 currency code.
   * @returns {Promise<ChartData>} Resolves with prices/market_caps/total_volumes arrays.
   * @throws {Error} If coinId is empty or the HTTP response is not 2xx.
   */
  static async fetchCoinChart(coinId, days = 7, vsCurrency = "usd") {
    if (!coinId) {
      throw new Error("coinId must be a non-empty string.");
    }
    const response = await fetch(
      `${API_BASE}/coins/${coinId}/chart?days=${days}&vs_currency=${vsCurrency}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch chart for ${coinId}: HTTP ${response.status}`);
    }
    return response.json();
  }
}
