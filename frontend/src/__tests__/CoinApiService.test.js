/**
 * @fileoverview Unit tests for CoinApiService.
 *
 * The global fetch API is mocked via vi.fn() so tests never hit the network.
 * Each test asserts on a single observable behaviour: the URL constructed,
 * the data returned, or the error thrown.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CoinApiService } from "../services/CoinApiService";

describe("CoinApiService", () => {
  describe("constructor", () => {
    it("throws when instantiated, enforcing static-only usage", () => {
      expect(() => new CoinApiService()).toThrow(
        "CoinApiService is a static utility class and cannot be instantiated."
      );
    });
  });

  // -------------------------------------------------------------------------
  describe("fetchMarkets", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("calls the correct endpoint with the default usd currency", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: "bitcoin" }],
      });

      await CoinApiService.fetchMarkets();

      expect(fetch).toHaveBeenCalledWith("/api/markets?vs_currency=usd");
    });

    it("passes a custom currency through to the query string", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await CoinApiService.fetchMarkets("eur");

      expect(fetch).toHaveBeenCalledWith("/api/markets?vs_currency=eur");
    });

    it("returns the parsed JSON array on success", async () => {
      const mockCoins = [{ id: "bitcoin", current_price: 60_000 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCoins,
      });

      const result = await CoinApiService.fetchMarkets();

      expect(result).toEqual(mockCoins);
    });

    it("throws a descriptive error on a non-2xx response", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 502 });

      await expect(CoinApiService.fetchMarkets()).rejects.toThrow("HTTP 502");
    });
  });

  // -------------------------------------------------------------------------
  describe("fetchCoinChart", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("throws immediately when coinId is an empty string", async () => {
      await expect(CoinApiService.fetchCoinChart("")).rejects.toThrow(
        "coinId must be a non-empty string."
      );
    });

    it("calls the correct endpoint with default days and currency", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prices: [] }),
      });

      await CoinApiService.fetchCoinChart("bitcoin");

      expect(fetch).toHaveBeenCalledWith(
        "/api/coins/bitcoin/chart?days=7&vs_currency=usd"
      );
    });

    it("includes the supplied days and currency in the URL", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ prices: [] }),
      });

      await CoinApiService.fetchCoinChart("ethereum", 30, "gbp");

      expect(fetch).toHaveBeenCalledWith(
        "/api/coins/ethereum/chart?days=30&vs_currency=gbp"
      );
    });

    it("returns the parsed chart data object on success", async () => {
      const mockData = { prices: [[1_700_000_000_000, 60_000]] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await CoinApiService.fetchCoinChart("bitcoin", 7);

      expect(result).toEqual(mockData);
    });

    it("throws a descriptive error on a non-2xx response", async () => {
      global.fetch.mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(CoinApiService.fetchCoinChart("bitcoin", 7)).rejects.toThrow(
        "HTTP 404"
      );
    });
  });

  // -------------------------------------------------------------------------
  describe("fetchWalletBalance", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("throws immediately when address is an empty string", async () => {
      await expect(CoinApiService.fetchWalletBalance("")).rejects.toThrow(
        "address must be a non-empty string."
      );
    });

    it("calls the correct endpoint with the encoded address", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ address: "0xabc", eth: 1.0 }),
      });

      await CoinApiService.fetchWalletBalance("0xabc");

      expect(fetch).toHaveBeenCalledWith("/api/wallet/0xabc");
    });

    it("returns the parsed balance object on success", async () => {
      const mockBalance = { address: "0xabc", eth: 2.5 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalance,
      });

      const result = await CoinApiService.fetchWalletBalance("0xabc");

      expect(result).toEqual(mockBalance);
    });

    it("throws using the backend detail message on a 400 response", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid Ethereum address '0xinvalid'." }),
      });

      await expect(CoinApiService.fetchWalletBalance("0xinvalid")).rejects.toThrow(
        "Invalid Ethereum address"
      );
    });

    it("falls back to HTTP status when no detail field is present", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({}),
      });

      await expect(CoinApiService.fetchWalletBalance("0xabc")).rejects.toThrow(
        "HTTP 502"
      );
    });
  });
});
