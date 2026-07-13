import { describe, expect, it } from "vitest";
import { formatCnpj, isValidCnpj, onlyDigits } from "./cnpj";

describe("onlyDigits", () => {
  it("strips everything that isn't a digit", () => {
    expect(onlyDigits("11.222.333/0001-81")).toBe("11222333000181");
    expect(onlyDigits("abc123def456")).toBe("123456");
  });

  it("returns an empty string for empty input", () => {
    expect(onlyDigits("")).toBe("");
  });
});

describe("isValidCnpj", () => {
  it("accepts a valid CNPJ, formatted or raw", () => {
    expect(isValidCnpj("11222333000181")).toBe(true);
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("12345678000195")).toBe(true);
  });

  it("rejects wrong length", () => {
    expect(isValidCnpj("1122233300018")).toBe(false);
    expect(isValidCnpj("112223330001811")).toBe(false);
    expect(isValidCnpj("")).toBe(false);
  });

  it("rejects blacklisted all-same-digit sequences", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });

  it("rejects a CNPJ with a wrong check digit", () => {
    expect(isValidCnpj("11222333000180")).toBe(false);
    expect(isValidCnpj("11222333000182")).toBe(false);
  });
});

describe("formatCnpj", () => {
  it("masks progressively as digits are typed", () => {
    expect(formatCnpj("1")).toBe("1");
    expect(formatCnpj("11")).toBe("11");
    expect(formatCnpj("112")).toBe("11.2");
    expect(formatCnpj("11222")).toBe("11.222");
    expect(formatCnpj("112223")).toBe("11.222.3");
    expect(formatCnpj("11222333")).toBe("11.222.333");
    expect(formatCnpj("112223330001")).toBe("11.222.333/0001");
    expect(formatCnpj("11222333000181")).toBe("11.222.333/0001-81");
  });

  it("ignores non-digit characters and caps at 14 digits", () => {
    expect(formatCnpj("11.222.333/0001-81")).toBe("11.222.333/0001-81");
    expect(formatCnpj("112223330001819999")).toBe("11.222.333/0001-81");
  });
});
