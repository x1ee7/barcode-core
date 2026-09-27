import { type BarcodeFormat, SPEC, assertFormat, extractDigits } from "./formats.js";
import { upcEExpand } from "./upce.js";

function mod10(digits: string, weights: number[]): string {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) sum += parseInt(digits[i]!, 10) * weights[i]!;
  return ((10 - (sum % 10)) % 10).toString();
}

/**
 * Compute the GS1 modulo-10 check digit and return the full code
 * (payload + check digit). Spaces and hyphens are ignored and short payloads
 * are left-padded with zeros. Throws for variable-length formats (which have
 * no check digit), for non-digit characters, and for payloads longer than the
 * format allows (pass the payload *without* its check digit).
 *
 * UPC-E is checked the GS1 way: the 7-digit payload (number system + 6-digit
 * body) is expanded to UPC-A and the check digit is taken from that.
 */
export function computeCheckDigit(format: BarcodeFormat, payload: string): string {
  assertFormat(format);
  const spec = SPEC[format];
  if (!spec) throw new Error(`${format} has no check digit (variable-length)`);
  const raw = extractDigits(payload, `${format} payload`);
  if (raw.length === 0) throw new Error(`${format} payload has no digits`);
  if (raw.length > spec.payloadLen) {
    throw new Error(
      `${format} payload must be at most ${spec.payloadLen} digits (got ${raw.length}); omit the check digit`,
    );
  }
  const digits = raw.padStart(spec.payloadLen, "0");
  if (format === "upce") {
    const upca = SPEC.upca!;
    return digits + mod10(upcEExpand(digits[0]!, digits.slice(1)), upca.weights);
  }
  return digits + mod10(digits, spec.weights);
}
