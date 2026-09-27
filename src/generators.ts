import { type BarcodeFormat, SPEC, assertFormat, extractDigits, isVariableLength } from "./formats.js";
import { computeCheckDigit } from "./checkdigit.js";
import { validateBarcodeText } from "./validate.js";

export { upcEExpand } from "./upce.js";

const ALNUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function randomDigits(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) out += Math.floor(Math.random() * 10).toString();
  return out;
}

/** Generate a single random, structurally valid code for the given format. */
export function generateRandom(format: BarcodeFormat): string {
  assertFormat(format);
  if (isVariableLength(format)) {
    let out = format === "fnsku" ? "X00" : "";
    const len = format === "fnsku" ? 7 : 10;
    for (let i = 0; i < len; i++) out += ALNUM[Math.floor(Math.random() * ALNUM.length)];
    return out;
  }
  if (format === "upce") {
    return computeCheckDigit(format, (Math.random() < 0.5 ? "0" : "1") + randomDigits(6));
  }
  const spec = SPEC[format]!;
  const prefix = format === "isbn" ? (Math.random() < 0.5 ? "978" : "979") : "";
  return computeCheckDigit(format, prefix + randomDigits(spec.payloadLen - prefix.length));
}

/**
 * Build a contiguous run of `count` codes from a shared prefix, starting at
 * `start`, each terminated with a valid check digit. Throws for
 * variable-length formats, an over-long or non-numeric prefix, a negative or
 * non-integer `start`/`count`, a run that would overflow the available
 * digits, or a prefix that yields invalid codes (e.g. UPC-E number system
 * other than 0/1, ISBN not starting 978/979).
 */
export function buildSequential(
  format: BarcodeFormat,
  prefix: string,
  start: number,
  count: number,
): string[] {
  assertFormat(format);
  if (isVariableLength(format)) {
    throw new Error(`sequential mode is not supported for ${format}`);
  }
  if (!Number.isSafeInteger(start) || start < 0) {
    throw new Error(`start must be a non-negative integer (got ${start})`);
  }
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error(`count must be a non-negative integer (got ${count})`);
  }
  const spec = SPEC[format]!;
  const cleanPrefix = extractDigits(prefix, "prefix");
  const suffixLen = spec.payloadLen - cleanPrefix.length;
  if (suffixLen < 1) throw new Error(`prefix '${prefix}' too long for ${format} (max ${spec.payloadLen - 1} digits)`);
  if (count > 0 && (start + count - 1).toString().length > suffixLen) {
    throw new Error(
      `sequential overflow: ${start + count - 1} does not fit in ${suffixLen} digit(s) after prefix '${prefix}'`,
    );
  }
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = computeCheckDigit(format, cleanPrefix + (start + i).toString().padStart(suffixLen, "0"));
    const check = validateBarcodeText(format, code);
    if (!check.ok) throw new Error(`prefix '${prefix}' produces invalid ${format} codes: ${check.error}`);
    codes.push(code);
  }
  return codes;
}
