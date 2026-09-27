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

describe("UPC-E check digit (computed on the UPC-A expansion)", () => {
  it("matches the reference code 01234565", () => {
    expect(computeCheckDigit("upce", "0123456")).toBe("01234565");
    expect(validateBarcodeText("upce", "01234565")).toEqual({ ok: true });
  });
  it("agrees with UPC-A for every body ending", () => {
    for (const body of ["654320", "654323", "654324", "654329", "123450"]) {
      const upce = computeCheckDigit("upce", "0" + body);
      const upca = computeCheckDigit("upca", upcEExpand("0", body));
      expect(upce.slice(-1)).toBe(upca.slice(-1));
    }
  });
  it("random and sequential UPC-E codes pass validation", () => {
    for (let i = 0; i < 500; i++) {
      const c = generateRandom("upce");
      expect(validateBarcodeText("upce", c)).toEqual({ ok: true });
    }
    for (const c of buildSequential("upce", "0", 1, 50)) {
      expect(validateBarcodeText("upce", c)).toEqual({ ok: true });
    }
  });
  it("rejects number systems other than 0/1", () => {
    expect(validateBarcodeText("upce", "51234565").ok).toBe(false);
    expect(() => computeCheckDigit("upce", "5123456")).toThrow(/number system/);
    expect(() => buildSequential("upce", "5", 1, 1)).toThrow(/number system/);
  });
});

describe("upcEExpand input checks", () => {
  it("throws on a short body or bad number system", () => {
    expect(() => upcEExpand("0", "12")).toThrow(/6 digits/);
    expect(() => upcEExpand("2", "123456")).toThrow(/number system/);
  });
});

describe("unknown formats", () => {
  it("throw everywhere instead of silently passing", () => {
    const bad = "UPCA" as never;
    expect(() => validateBarcodeText(bad, "garbage")).toThrow(/unknown barcode format/);
    expect(() => computeCheckDigit(bad, "1")).toThrow(/unknown barcode format/);
    expect(() => generateRandom(bad)).toThrow(/unknown barcode format/);
    expect(() => buildSequential(bad, "", 0, 1)).toThrow(/unknown barcode format/);
  });
});

describe("input strictness", () => {
  it("validate rejects stray letters but allows spaces/hyphens", () => {
    expect(validateBarcodeText("upca", "hello 036000291452").ok).toBe(false);
    expect(validateBarcodeText("isbn", "978-0-13-110362-7")).toEqual({ ok: true });
  });
  it("computeCheckDigit refuses to truncate or strip letters", () => {
    expect(() => computeCheckDigit("upca", "036000291452")).toThrow(/at most 11/);
    expect(() => computeCheckDigit("upca", "ABC")).toThrow(/only contain digits/);
    expect(() => computeCheckDigit("upca", "")).toThrow(/no digits/);
  });
  it("still left-pads short payloads", () => {
    expect(computeCheckDigit("ean8", "1")).toHaveLength(8);
  });
  it("ISBN requires 978/979", () => {
    expect(validateBarcodeText("isbn", "0000000000000").ok).toBe(false);
    expect(() => buildSequential("isbn", "", 1, 1)).toThrow(/978 or 979/);
    for (let i = 0; i < 100; i++) expect(generateRandom("isbn")).toMatch(/^97[89]\d{10}$/);
  });
  it("variable-length formats reject empty text and non-ASCII Code 128", () => {
    expect(validateBarcodeText("code128", "").ok).toBe(false);
    expect(validateBarcodeText("code128", "café").ok).toBe(false);
    expect(validateBarcodeText("datamatrix", "café")).toEqual({ ok: true });
  });
});

describe("buildSequential argument checks", () => {
  it("rejects negative / fractional / NaN start and count", () => {
    expect(() => buildSequential("upca", "123", -5, 2)).toThrow(/start/);
    expect(() => buildSequential("upca", "123", 1.5, 1)).toThrow(/start/);
    expect(() => buildSequential("upca", "123", 1, NaN)).toThrow(/count/);
  });
  it("detects overflow before producing anything", () => {
    expect(() => buildSequential("upca", "1234567890", 5, 6)).toThrow(/overflow/);
    expect(buildSequential("upca", "1234567890", 5, 5)).toHaveLength(5);
  });
  it("matches the README example", () => {
    expect(buildSequential("ean13", "978", 1, 3)).toEqual(["9780000000019", "9780000000026", "9780000000033"]);
  });
});
