/**
 * @fileoverview Unit tests for useWalletBalance hook.
 *
 * CoinApiService is fully mocked so no network requests are made.
 * Tests assert on the public interface only: initial state, successful
 * lookup, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { CoinApiService } from "../services/CoinApiService";

vi.mock("../services/CoinApiService", () => ({
  CoinApiService: {
    fetchWalletBalance: vi.fn(),
  },
}));

const VALID_ADDRESS = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";

describe("useWalletBalance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("starts with no balance, not loading, no error", () => {
      const { result } = renderHook(() => useWalletBalance());
      expect(result.current.balance).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("lookup — success", () => {
    it("sets balance after a successful fetch", async () => {
      CoinApiService.fetchWalletBalance.mockResolvedValue({
        address: VALID_ADDRESS,
        eth: 1.5,
      });
      const { result } = renderHook(() => useWalletBalance());

      await act(async () => {
        result.current.lookup(VALID_ADDRESS);
      });

      expect(result.current.balance).toEqual({ address: VALID_ADDRESS, eth: 1.5 });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("passes the address through to the API service", async () => {
      CoinApiService.fetchWalletBalance.mockResolvedValue({
        address: VALID_ADDRESS,
        eth: 0,
      });
      const { result } = renderHook(() => useWalletBalance());

      await act(async () => {
        result.current.lookup(VALID_ADDRESS);
      });

      expect(CoinApiService.fetchWalletBalance).toHaveBeenCalledWith(VALID_ADDRESS);
    });

    it("clears a previous error when a new lookup succeeds", async () => {
      CoinApiService.fetchWalletBalance
        .mockRejectedValueOnce(new Error("bad address"))
        .mockResolvedValueOnce({ address: VALID_ADDRESS, eth: 2.0 });

      const { result } = renderHook(() => useWalletBalance());

      await act(async () => { result.current.lookup(VALID_ADDRESS); });
      await act(async () => { result.current.lookup(VALID_ADDRESS); });

      expect(result.current.error).toBeNull();
      expect(result.current.balance).toEqual({ address: VALID_ADDRESS, eth: 2.0 });
    });
  });

  describe("lookup — error", () => {
    it("sets error message when the fetch throws", async () => {
      CoinApiService.fetchWalletBalance.mockRejectedValue(
        new Error("Invalid Ethereum address")
      );
      const { result } = renderHook(() => useWalletBalance());

      await act(async () => {
        result.current.lookup("not-an-address");
      });

      expect(result.current.error).toBe("Invalid Ethereum address");
      expect(result.current.balance).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("clears a previous balance when a new lookup fails", async () => {
      CoinApiService.fetchWalletBalance
        .mockResolvedValueOnce({ address: VALID_ADDRESS, eth: 1.0 })
        .mockRejectedValueOnce(new Error("rate limited"));

      const { result } = renderHook(() => useWalletBalance());

      await act(async () => { result.current.lookup(VALID_ADDRESS); });
      await act(async () => { result.current.lookup(VALID_ADDRESS); });

      expect(result.current.balance).toBeNull();
      expect(result.current.error).toBe("rate limited");
    });
  });
});
