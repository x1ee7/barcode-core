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
