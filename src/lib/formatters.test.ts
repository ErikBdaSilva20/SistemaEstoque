import { describe, expect, it } from "vitest";
import { formatBRL, formatDate, formatDateTime, formatNumber } from "./formatters";

// Intl formats BRL with a non-breaking space after "R$"; normalize to a
// regular space so assertions don't depend on the ICU build's whitespace choice.
const norm = (s: string) => s.replace(/\s/g, " ");

describe("formatBRL", () => {
  it("formats a number as BRL currency", () => {
    expect(norm(formatBRL(1234.5))).toBe("R$ 1.234,50");
    expect(norm(formatBRL(0))).toBe("R$ 0,00");
  });

  it("coerces numeric strings", () => {
    expect(norm(formatBRL("99.9"))).toBe("R$ 99,90");
  });

  it("falls back to R$ 0,00 for null, undefined, or non-numeric input", () => {
    expect(norm(formatBRL(null))).toBe("R$ 0,00");
    expect(norm(formatBRL(undefined))).toBe("R$ 0,00");
    expect(norm(formatBRL("not-a-number"))).toBe("R$ 0,00");
  });
});

describe("formatNumber", () => {
  it("formats with pt-BR grouping and up to 3 decimal places by default", () => {
    expect(formatNumber(1234.5)).toBe("1.234,5");
    expect(formatNumber(1234)).toBe("1.234");
    expect(formatNumber(1.23456)).toBe("1,235");
  });

  it("respects a custom fractionDigits", () => {
    expect(formatNumber(1.23456, 2)).toBe("1,23");
    expect(formatNumber(1, 0)).toBe("1");
  });

  it("falls back to 0 for null, undefined, or non-numeric input", () => {
    expect(formatNumber(null)).toBe("0");
    expect(formatNumber(undefined)).toBe("0");
    expect(formatNumber("abc")).toBe("0");
  });
});

describe("formatDate", () => {
  it("formats a date-only string (YYYY-MM-DD) without shifting a day back", () => {
    // Regression: date-only strings parse as UTC midnight per spec, which
    // used to render as the previous day in timezones behind UTC.
    expect(formatDate("2026-03-15")).toBe("15/03/2026");
    expect(formatDate("2026-01-01")).toBe("01/01/2026");
  });

  it("formats a full ISO timestamp using its calendar date", () => {
    expect(formatDate("2026-03-15T14:30:00")).toBe("15/03/2026");
  });

  it("returns the placeholder for null/undefined/empty input", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("formats date and time together", () => {
    expect(formatDateTime("2026-03-15T14:30:00")).toBe("15/03/2026 14:30");
  });

  it("returns the placeholder for null/undefined/empty input", () => {
    expect(formatDateTime(null)).toBe("—");
    expect(formatDateTime(undefined)).toBe("—");
    expect(formatDateTime("")).toBe("—");
  });
});
