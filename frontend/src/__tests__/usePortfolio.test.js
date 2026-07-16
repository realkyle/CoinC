/**
 * @fileoverview Unit tests for usePortfolio hook.
 *
 * Tests assert on the public interface only: the holdings array shape,
 * and the behaviour of addHolding / removeHolding. Internal implementation
 * details (how state is stored) are not tested.
 */

import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePortfolio } from "../hooks/usePortfolio";

describe("usePortfolio", () => {
  describe("initial state", () => {
    it("starts with no holdings", () => {
      const { result } = renderHook(() => usePortfolio());
      expect(result.current.holdings).toHaveLength(0);
    });
  });

  describe("addHolding", () => {
    it("adds a new holding when the coin is not yet in the portfolio", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1.5));

      expect(result.current.holdings).toHaveLength(1);
      expect(result.current.holdings[0]).toEqual({ coinId: "bitcoin", quantity: 1.5 });
    });

    it("adds multiple distinct coins as separate holdings", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1));
      act(() => result.current.addHolding("ethereum", 5));

      expect(result.current.holdings).toHaveLength(2);
    });

    it("updates quantity when the same coin is added again", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1));
      act(() => result.current.addHolding("bitcoin", 2.5));

      expect(result.current.holdings).toHaveLength(1);
      expect(result.current.holdings[0].quantity).toBe(2.5);
    });

    it("does not add a holding when quantity is zero", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 0));

      expect(result.current.holdings).toHaveLength(0);
    });

    it("does not add a holding when quantity is negative", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", -1));

      expect(result.current.holdings).toHaveLength(0);
    });

    it("does not add a holding when coinId is empty", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("", 1));

      expect(result.current.holdings).toHaveLength(0);
    });
  });

  describe("removeHolding", () => {
    it("removes the holding for the given coin", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1));
      act(() => result.current.removeHolding("bitcoin"));

      expect(result.current.holdings).toHaveLength(0);
    });

    it("only removes the target coin, leaving others untouched", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1));
      act(() => result.current.addHolding("ethereum", 5));
      act(() => result.current.removeHolding("bitcoin"));

      expect(result.current.holdings).toHaveLength(1);
      expect(result.current.holdings[0].coinId).toBe("ethereum");
    });

    it("is a no-op when the coin is not in the portfolio", () => {
      const { result } = renderHook(() => usePortfolio());

      act(() => result.current.addHolding("bitcoin", 1));
      act(() => result.current.removeHolding("ethereum")); // not in portfolio

      expect(result.current.holdings).toHaveLength(1);
    });
  });
});
