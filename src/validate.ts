import { type BarcodeFormat, SPEC, isCaseSensitive } from "./formats.js";
import { computeCheckDigit } from "./checkdigit.js";

/** Upper-case the text unless the format is case-sensitive (Data Matrix). */
export function normalizeText(format: BarcodeFormat, text: string): string {
  return isCaseSensitive(format) ? text : text.toUpperCase();
}

/**
 * Validate that `text` has the correct digit count and a valid check digit
 * for the given format. Variable-length formats always pass.
 */
export function validateBarcodeText(
  format: BarcodeFormat,
  text: string,
): { ok: true } | { ok: false; error: string } {
  const spec = SPEC[format as keyof typeof SPEC];
  if (!spec) return { ok: true };
  const totalLen = spec.payloadLen + 1;
  const digits = text.replace(/\D/g, "");
  if (digits.length !== totalLen) {
    return { ok: false, error: `${format} requires exactly ${totalLen} digits (got ${digits.length})` };
  }
  const expected = computeCheckDigit(format, digits.slice(0, spec.payloadLen)).slice(-1);
  const actual = digits.slice(-1);
  if (expected !== actual) {
    return { ok: false, error: `invalid check digit — expected ${expected}, got ${actual}` };
  }
  return { ok: true };
}
