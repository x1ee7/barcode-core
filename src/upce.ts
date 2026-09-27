/**
 * Expand a 6-digit UPC-E compressed body (plus number system) into its
 * 11-digit UPC-A payload, following the GS1 zero-suppression rules.
 * Throws unless `numSystem` is "0" or "1" and `comp` is exactly 6 digits.
 */
export function upcEExpand(numSystem: string, comp: string): string {
  if (numSystem !== "0" && numSystem !== "1") {
    throw new Error(`UPC-E number system must be 0 or 1 (got '${numSystem}')`);
  }
  if (!/^\d{6}$/.test(comp)) {
    throw new Error(`UPC-E body must be exactly 6 digits (got '${comp}')`);
  }
  const last = comp[5]!;
  if (last >= "0" && last <= "2") return numSystem + comp.slice(0, 2) + last + "0000" + comp.slice(2, 5);
  if (last === "3") return numSystem + comp.slice(0, 3) + "00000" + comp.slice(3, 5);
  if (last === "4") return numSystem + comp.slice(0, 4) + "00000" + comp[4]!;
  return numSystem + comp.slice(0, 5) + "0000" + last;
}
