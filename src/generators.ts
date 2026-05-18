import { type BarcodeFormat, SPEC, isVariableLength } from "./formats.js";
import { computeCheckDigit } from "./checkdigit.js";

/**
 * Expand a 6-digit UPC-E compressed body (plus number system) into its
 * 11-digit UPC-A payload, following the GS1 zero-suppression rules.
 */
export function upcEExpand(numSystem: string, comp: string): string {
  const last = comp[5]!;
  if (last >= "0" && last <= "2") return numSystem + comp.slice(0, 2) + last + "0000" + comp.slice(2, 5);
  if (last === "3") return numSystem + comp.slice(0, 3) + "00000" + comp.slice(3, 5);
  if (last === "4") return numSystem + comp.slice(0, 4) + "00000" + comp[4]!;
  return numSystem + comp.slice(0, 5) + "0000" + last;
}

/** Generate a single random, structurally valid code for the given format. */
export function generateRandom(format: BarcodeFormat): string {
  if (format === "fnsku") {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "X00";
    for (let i = 0; i < 7; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  if (isVariableLength(format)) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let out = "";
    for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  if (format === "upce") {
    const ns = Math.random() < 0.5 ? "0" : "1";
    let comp = "";
    for (let i = 0; i < 6; i++) comp += Math.floor(Math.random() * 10).toString();
    const upca11 = upcEExpand(ns, comp);
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += parseInt(upca11[i]!, 10) * (i % 2 === 0 ? 3 : 1);
    const check = ((10 - (sum % 10)) % 10).toString();
    return ns + comp + check;
  }
  const spec = SPEC[format]!;
  let payload = format === "isbn" ? "978" : "";
  while (payload.length < spec.payloadLen) payload += Math.floor(Math.random() * 10).toString();
  return computeCheckDigit(format, payload);
}

/**
 * Build a contiguous run of `count` codes from a shared prefix, starting at
 * `start`, each terminated with a valid check digit. Throws for
 * variable-length formats or an over-long prefix.
 */
export function buildSequential(
  format: BarcodeFormat,
  prefix: string,
  start: number,
  count: number,
): string[] {
  if (isVariableLength(format)) {
    throw new Error(`sequential mode is not supported for ${format}`);
  }
  const spec = SPEC[format]!;
  const cleanPrefix = prefix.replace(/\D/g, "");
  const suffixLen = spec.payloadLen - cleanPrefix.length;
  if (suffixLen < 1) throw new Error(`prefix '${prefix}' too long for ${format} (max ${spec.payloadLen - 1})`);
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const suffix = (start + i).toString().padStart(suffixLen, "0");
    if (suffix.length > suffixLen) throw new Error("sequential overflow");
    codes.push(computeCheckDigit(format, cleanPrefix + suffix));
  }
  return codes;
}
