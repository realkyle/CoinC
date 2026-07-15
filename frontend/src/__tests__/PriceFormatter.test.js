/**
 * @fileoverview Unit tests for PriceFormatter.
 *
 * Covers every public static method and their boundary conditions.
 * No mocking required — PriceFormatter is pure computation.
 */

import { describe, it, expect } from "vitest";
import { PriceFormatter } from "../utils/PriceFormatter";

describe("PriceFormatter", () => {
  describe("constructor", () => {
    it("throws when instantiated, enforcing static-only usage", () => {
      expect(() => new PriceFormatter()).toThrow(
        "PriceFormatter is a static utility class and cannot be instantiated."
      );
    });
  });

  // -------------------------------------------------------------------------
  describe("formatPrice", () => {
    it("formats prices >= $1 000 without decimal places", () => {
      expect(PriceFormatter.formatPrice(65_000)).toBe("$65,000");
    });

    it("formats prices exactly at $1 000 without decimal places", () => {
      expect(PriceFormatter.formatPrice(1_000)).toBe("$1,000");
    });

    it("formats prices >= $1 with exactly two decimal places", () => {
      // Use a value below $1 000 so it falls into the two-decimal tier, not the no-decimal tier.
      expect(PriceFormatter.formatPrice(8.4)).toBe("$8.40");
    });

    it("formats prices exactly at $1 with two decimal places", () => {
      expect(PriceFormatter.formatPrice(1)).toBe("$1.00");
    });

    it("formats sub-dollar prices with at least four decimal places", () => {
      const result = PriceFormatter.formatPrice(0.073996);
      expect(result).toMatch(/^\$0\.073/);
    });

    it("formats very small prices without dropping significant figures", () => {
      const result = PriceFormatter.formatPrice(0.000123);
      expect(result).toContain("0.000123");
    });
  });

  // -------------------------------------------------------------------------
  describe("formatLargeNumber", () => {
    it("formats trillions with a T suffix and two decimal places", () => {
      expect(PriceFormatter.formatLargeNumber(1_300_000_000_000)).toBe("$1.30T");
    });

    it("formats billions with a B suffix", () => {
      expect(PriceFormatter.formatLargeNumber(231_930_000_000)).toBe("$231.93B");
    });

    it("formats millions with an M suffix", () => {
      expect(PriceFormatter.formatLargeNumber(588_670_000)).toBe("$588.67M");
    });

    it("formats values below $1M as a locale string without suffix", () => {
      const result = PriceFormatter.formatLargeNumber(500_000);
      expect(result).toContain("500");
      expect(result).not.toMatch(/[TBM]$/);
    });
  });

  // -------------------------------------------------------------------------
  describe("formatPercentage", () => {
    it("prefixes positive values with a + sign", () => {
      expect(PriceFormatter.formatPercentage(2.45)).toBe("+2.45%");
    });

    it("uses the natural - sign for negative values", () => {
      expect(PriceFormatter.formatPercentage(-0.83)).toBe("-0.83%");
    });

    it("formats zero as +0.00% (unambiguously non-negative)", () => {
      expect(PriceFormatter.formatPercentage(0)).toBe("+0.00%");
    });

    it("rounds to two decimal places", () => {
      expect(PriceFormatter.formatPercentage(1.2349)).toBe("+1.23%");
    });
  });
});
