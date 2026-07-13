// Testes das funções utilitárias de import/export (str, num, bool).
// Estas funções fazem coerção de tipos de dados vindos de CSV/XLSX e são
// críticas para a corretude da importação em lote — um bug aqui silencioso
// descarta ou corrompe dados de usuários sem mensagem de erro clara.
import { describe, expect, it } from "vitest";
import { str, num, bool } from "./import-export";

// ── str ──────────────────────────────────────────────────────────────────────

describe("str", () => {
  it("converts a string to trimmed string", () => {
    expect(str("  hello  ")).toBe("hello");
    expect(str("value")).toBe("value");
  });

  it("returns empty string for null and undefined", () => {
    expect(str(null)).toBe("");
    expect(str(undefined)).toBe("");
  });

  it("coerces numbers to string", () => {
    expect(str(42)).toBe("42");
    expect(str(3.14)).toBe("3.14");
  });

  it("coerces booleans to string", () => {
    expect(str(true)).toBe("true");
    expect(str(false)).toBe("false");
  });

  it("returns empty string for empty string", () => {
    expect(str("")).toBe("");
  });
});

// ── num ──────────────────────────────────────────────────────────────────────

describe("num", () => {
  it("passes through finite numbers directly", () => {
    expect(num(42)).toBe(42);
    expect(num(0)).toBe(0);
    expect(num(-5.5)).toBe(-5.5);
  });

  it("returns null for non-finite numbers", () => {
    expect(num(Infinity)).toBeNull();
    expect(num(-Infinity)).toBeNull();
    expect(num(NaN)).toBeNull();
  });

  it("returns null for null, undefined, and empty string", () => {
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
    expect(num("")).toBeNull();
  });

  it("parses plain numeric strings (integers and pt-BR decimals)", () => {
    expect(num("42")).toBe(42);
    // Note: num() strips periods first (pt-BR thousand separator), then replaces comma
    // with dot for decimal. "3.14" → stripped period → "314". Use comma for decimals.
    expect(num("3,14")).toBe(3.14);
    expect(num("  100  ")).toBe(100);
  });

  it("parses pt-BR formatted numbers (period as thousand-sep, comma as decimal)", () => {
    // R$ 1.234,56 format from Brazilian spreadsheets
    expect(num("1.234,56")).toBe(1234.56);
    expect(num("10,50")).toBe(10.5);
    expect(num("1.000")).toBe(1000);
  });

  it("returns null for non-numeric strings", () => {
    expect(num("abc")).toBeNull();
    expect(num("R$ 10")).toBeNull();
  });
});

// ── bool ─────────────────────────────────────────────────────────────────────

describe("bool", () => {
  it('returns true for "sim", "s", "yes", "y", "1", "true" (case-insensitive)', () => {
    for (const v of ["sim", "SIM", "Sim", "s", "S", "yes", "YES", "y", "Y", "1", "true", "TRUE"]) {
      expect(bool(v)).toBe(true);
    }
  });

  it('returns false for "não", "no", "n", "0", "false", empty, and unknown strings', () => {
    for (const v of ["não", "nao", "no", "n", "N", "0", "false", "FALSE", "", "maybe", "2"]) {
      expect(bool(v)).toBe(false);
    }
  });

  it("handles null and undefined as false", () => {
    expect(bool(null)).toBe(false);
    expect(bool(undefined)).toBe(false);
  });
});
