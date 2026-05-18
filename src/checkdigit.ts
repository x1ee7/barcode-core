import { type BarcodeFormat, SPEC } from "./formats.js";

/**
 * Compute the GS1 modulo-10 check digit and return the full code
 * (payload + check digit). Throws for variable-length formats, which have
 * no check digit.
 */
export function computeCheckDigit(format: BarcodeFormat, payload: string): string {
  const spec = SPEC[format];
  if (!spec) throw new Error(`${format} has no check digit (variable-length)`);
  const digits = payload.replace(/\D/g, "").padStart(spec.payloadLen, "0").slice(0, spec.payloadLen);
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += parseInt(digits[i]!, 10) * spec.weights[i]!;
  return digits + ((10 - (sum % 10)) % 10).toString();
}
