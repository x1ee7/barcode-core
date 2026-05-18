import { describe, it, expect } from "vitest";
import {
  computeCheckDigit,
  validateBarcodeText,
  upcEExpand,
  generateRandom,
  buildSequential,
  isVariableLength,
} from "../src/index.js";

describe("computeCheckDigit", () => {
  // Reference values verifiable against any public GTIN calculator.
  it("UPC-A: classic 036000291452", () => {
    expect(computeCheckDigit("upca", "03600029145")).toBe("036000291452");
  });
  it("EAN-13 / ISBN-13: 9780131103627", () => {
    expect(computeCheckDigit("ean13", "978013110362")).toBe("9780131103627");
    expect(computeCheckDigit("isbn", "978013110362")).toBe("9780131103627");
  });
  it("EAN-8: 96385074", () => {
    expect(computeCheckDigit("ean8", "9638507")).toBe("96385074");
  });
  it("throws for variable-length formats", () => {
    expect(() => computeCheckDigit("code128", "ABC123")).toThrow(/no check digit/);
  });
});

describe("validateBarcodeText", () => {
  it("accepts a valid UPC-A", () => {
    expect(validateBarcodeText("upca", "036000291452")).toEqual({ ok: true });
  });
  it("rejects a bad check digit", () => {
    const r = validateBarcodeText("upca", "036000291450");
    expect(r.ok).toBe(false);
  });
  it("rejects wrong digit count", () => {
    const r = validateBarcodeText("ean13", "12345");
    expect(r.ok).toBe(false);
  });
  it("passes through variable-length formats", () => {
    expect(validateBarcodeText("code128", "anything")).toEqual({ ok: true });
  });
});

describe("upcEExpand", () => {
  it("expands a last-digit-5 body", () => {
    expect(upcEExpand("0", "123455")).toBe("01234500005");
  });
});

describe("generateRandom", () => {
  it("produces a self-consistent UPC-A", () => {
    const code = generateRandom("upca");
    expect(code).toHaveLength(12);
    expect(validateBarcodeText("upca", code)).toEqual({ ok: true });
  });
  it("FNSKU starts with X00 and is 10 chars", () => {
    const code = generateRandom("fnsku");
    expect(code).toMatch(/^X00[A-Z0-9]{7}$/);
  });
});

describe("buildSequential", () => {
  it("emits a contiguous, check-digit-terminated run", () => {
    const codes = buildSequential("ean13", "978", 1, 3);
    expect(codes).toHaveLength(3);
    for (const c of codes) expect(validateBarcodeText("ean13", c)).toEqual({ ok: true });
  });
  it("throws for variable-length formats", () => {
    expect(isVariableLength("datamatrix")).toBe(true);
    expect(() => buildSequential("datamatrix", "1", 1, 1)).toThrow(/not supported/);
  });
});
