/**
 * Barcode format definitions and the GTIN-family check-digit specification.
 *
 * The {@link SPEC} table is the heart of the library: each fixed-length
 * symbology is defined by its payload length and the alternating positional
 * weights used by the modulo-10 check-digit algorithm.
 */

export type BarcodeFormat =
  | "upca"
  | "upce"
  | "ean13"
  | "ean8"
  | "isbn"
  | "itf14"
  | "code128"
  | "datamatrix"
  | "fnsku";

/** Every supported format, in declaration order. */
const FORMATS: ReadonlySet<string> = new Set<BarcodeFormat>([
  "upca", "upce", "ean13", "ean8", "isbn", "itf14", "code128", "datamatrix", "fnsku",
]);

/**
 * Throw a descriptive error for an unknown format. Guards plain-JS callers
 * against typos like "UPCA" silently validating or crashing.
 */
export function assertFormat(format: unknown): asserts format is BarcodeFormat {
  if (typeof format !== "string" || !FORMATS.has(format)) {
    throw new Error(`unknown barcode format '${String(format)}' (expected one of: ${[...FORMATS].join(", ")})`);
  }
}

/**
 * Strip the separators people commonly type into numeric codes (spaces and
 * hyphens) and return the bare digits. Throws on anything else, so stray
 * letters are never silently discarded.
 */
export function extractDigits(text: string, what: string): string {
  if (typeof text !== "string") throw new Error(`${what} must be a string (got ${typeof text})`);
  const bad = text.match(/[^\d\s-]/);
  if (bad) throw new Error(`${what} may only contain digits, spaces, and hyphens (found '${bad[0]}')`);
  return text.replace(/\D/g, "");
}

const VARIABLE_LENGTH: Set<BarcodeFormat> = new Set(["code128", "datamatrix", "fnsku"]);

/** True for symbologies that carry an arbitrary-length payload (no check digit). */
export function isVariableLength(f: BarcodeFormat): boolean {
  return VARIABLE_LENGTH.has(f);
}

/** Only Data Matrix preserves character case; everything else is upper-cased. */
export function isCaseSensitive(format: BarcodeFormat): boolean {
  return format === "datamatrix";
}

export type FixedSpec = { payloadLen: number; weights: number[] };

/**
 * Payload length (digits before the check digit) and positional weights for
 * each fixed-length symbology. Variable-length formats are intentionally absent.
 */
export const SPEC: Partial<Record<BarcodeFormat, FixedSpec>> = {
  upca:  { payloadLen: 11, weights: [3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3] },
  upce:  { payloadLen: 7,  weights: [3, 1, 3, 1, 3, 1, 3] },
  ean13: { payloadLen: 12, weights: [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3] },
  ean8:  { payloadLen: 7,  weights: [3, 1, 3, 1, 3, 1, 3] },
  isbn:  { payloadLen: 12, weights: [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3] },
  itf14: { payloadLen: 13, weights: [3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3] },
};
