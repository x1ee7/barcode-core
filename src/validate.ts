import { type BarcodeFormat, SPEC, assertFormat, isCaseSensitive } from "./formats.js";
import { computeCheckDigit } from "./checkdigit.js";

/** Upper-case the text unless the format is case-sensitive (Data Matrix). */
export function normalizeText(format: BarcodeFormat, text: string): string {
  assertFormat(format);
  return isCaseSensitive(format) ? text : text.toUpperCase();
}

type Result = { ok: true } | { ok: false; error: string };

/**
 * Validate `text` for the given format.
 *
 * Fixed-length formats: only digits (plus spaces/hyphens as separators), the
 * exact digit count, a valid check digit, number system 0/1 for UPC-E and a
 * 978/979 prefix for ISBN-13.
 *
 * Variable-length formats: non-empty; Code 128 and FNSKU must be ASCII.
 */
export function validateBarcodeText(format: BarcodeFormat, text: string): Result {
  assertFormat(format);
  if (typeof text !== "string") return { ok: false, error: `text must be a string (got ${typeof text})` };
  const spec = SPEC[format];
  if (!spec) {
    if (text.length === 0) return { ok: false, error: `${format} text is empty` };
    if (format !== "datamatrix" && /[^\x00-\x7F]/.test(text)) {
      return { ok: false, error: `${format} can only encode ASCII characters` };
    }
    return { ok: true };
  }
  const bad = text.match(/[^\d\s-]/);
  if (bad) return { ok: false, error: `${format} may only contain digits (found '${bad[0]}')` };
  const totalLen = spec.payloadLen + 1;
  const digits = text.replace(/\D/g, "");
  if (digits.length !== totalLen) {
    return { ok: false, error: `${format} requires exactly ${totalLen} digits (got ${digits.length})` };
  }
  if (format === "upce" && digits[0] !== "0" && digits[0] !== "1") {
    return { ok: false, error: `upce number system must be 0 or 1 (got ${digits[0]})` };
  }
  if (format === "isbn" && !/^97[89]/.test(digits)) {
    return { ok: false, error: `isbn must start with 978 or 979 (got ${digits.slice(0, 3)})` };
  }
  const expected = computeCheckDigit(format, digits.slice(0, spec.payloadLen)).slice(-1);
  const actual = digits.slice(-1);
  if (expected !== actual) {
    return { ok: false, error: `invalid check digit — expected ${expected}, got ${actual}` };
  }
  return { ok: true };
}
