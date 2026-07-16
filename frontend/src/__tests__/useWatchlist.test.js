/**
 * @fileoverview Unit tests for useWatchlist hook.
 *
 * Uses renderHook from @testing-library/react to drive the hook through
 * its public interface without mounting a full component tree.
 * Tests assert on observable outputs (watchedIds, isWatched) only —
 * never on internal implementation details like how the Set is stored.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useWatchlist } from "../hooks/useWatchlist";

describe("useWatchlist", () => {
  describe("initial state", () => {
    it("starts with an empty watchlist", () => {
      const { result } = renderHook(() => useWatchlist());
      expect(result.current.watchedIds.size).toBe(0);
    });

    it("reports no coin as watched initially", () => {
      const { result } = renderHook(() => useWatchlist());
      expect(result.current.isWatched("bitcoin")).toBe(false);
    });
  });

  describe("toggleWatchlist", () => {
    it("adds a coin when it is not yet watched", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("bitcoin"));

      expect(result.current.isWatched("bitcoin")).toBe(true);
    });

    it("removes a coin when it is already watched", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("bitcoin"));
      act(() => result.current.toggleWatchlist("bitcoin"));

      expect(result.current.isWatched("bitcoin")).toBe(false);
    });

    it("toggling one coin does not affect other watched coins", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("bitcoin"));
      act(() => result.current.toggleWatchlist("ethereum"));
      act(() => result.current.toggleWatchlist("bitcoin"));

      expect(result.current.isWatched("bitcoin")).toBe(false);
      expect(result.current.isWatched("ethereum")).toBe(true);
    });

    it("can watch multiple coins simultaneously", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("bitcoin"));
      act(() => result.current.toggleWatchlist("ethereum"));
      act(() => result.current.toggleWatchlist("solana"));

      expect(result.current.watchedIds.size).toBe(3);
      expect(result.current.isWatched("bitcoin")).toBe(true);
      expect(result.current.isWatched("ethereum")).toBe(true);
      expect(result.current.isWatched("solana")).toBe(true);
    });
  });

  describe("isWatched", () => {
    it("returns false for a coin that was never toggled", () => {
      const { result } = renderHook(() => useWatchlist());
      expect(result.current.isWatched("dogecoin")).toBe(false);
    });

    it("returns true immediately after a coin is added", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("dogecoin"));

      expect(result.current.isWatched("dogecoin")).toBe(true);
    });

    it("returns false after a coin is toggled off", () => {
      const { result } = renderHook(() => useWatchlist());

      act(() => result.current.toggleWatchlist("dogecoin"));
      act(() => result.current.toggleWatchlist("dogecoin"));

      expect(result.current.isWatched("dogecoin")).toBe(false);
    });
  });
});
