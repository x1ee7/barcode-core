export {
  type BarcodeFormat,
  type FixedSpec,
  SPEC,
  isVariableLength,
  isCaseSensitive,
} from "./formats.js";
export { computeCheckDigit } from "./checkdigit.js";
export { normalizeText, validateBarcodeText } from "./validate.js";
export { upcEExpand, generateRandom, buildSequential } from "./generators.js";
