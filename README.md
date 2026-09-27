# @x1ee7/barcode-core

[![CI](https://github.com/x1ee7/barcode-core/actions/workflows/ci.yml/badge.svg)](https://github.com/x1ee7/barcode-core/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@x1ee7/barcode-core.svg)](https://www.npmjs.com/package/@x1ee7/barcode-core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-db61a2)](https://github.com/sponsors/x1ee7)

**Zero-dependency UPC / EAN / ISBN / ITF-14 barcode check-digit math,
validation, UPC-E expansion, and random / sequential code generation for
JavaScript and TypeScript.** Calculate and verify the GS1 mod-10 check digit
for UPC-A, UPC-E, EAN-13, EAN-8, ISBN-13, and ITF-14 — no image rendering, no
dependencies, just the numbers.

This is the production barcode engine behind **[upcgen.com](https://upcgen.com)** —
the rendering layer stays in the app; the math is open.

## Install

```sh
npm install @x1ee7/barcode-core
```

```sh
pnpm add @x1ee7/barcode-core
# or: yarn add @x1ee7/barcode-core
```

ESM + CommonJS + TypeScript types. No dependencies.

## Usage

```ts
import {
  computeCheckDigit,
  validateBarcodeText,
  upcEExpand,
  generateRandom,
  buildSequential,
} from "@x1ee7/barcode-core";

// Append the GS1 mod-10 check digit
computeCheckDigit("upca", "03600029145");   // → "036000291452"
computeCheckDigit("ean13", "978013110362"); // → "9780131103627"

// Validate digit count + check digit
validateBarcodeText("upca", "036000291452"); // → { ok: true }
validateBarcodeText("upca", "036000291450"); // → { ok: false, error: "invalid check digit — expected 2, got 0" }

// UPC-E (number system + 6-digit body); check digit comes from the UPC-A expansion
computeCheckDigit("upce", "0123456"); // → "01234565"
upcEExpand("0", "123455");            // → "01234500005"

// One random, structurally valid code
generateRandom("ean13"); // → e.g. "4006381333931"

// A contiguous run sharing a prefix, each with a valid check digit
buildSequential("ean13", "978", 1, 3);
// → ["9780000000019", "9780000000026", "9780000000033"]
```

## How the GS1 mod-10 check digit works

UPC-A, EAN-13, EAN-8, ISBN-13, and ITF-14 all terminate in a single
**GS1 mod-10 check digit**. From the right of the payload, digits are weighted
alternately by 3 and 1, summed, and the check digit is whatever brings that
sum up to the next multiple of 10:

```
checkDigit = (10 − (weightedSum mod 10)) mod 10
```

`computeCheckDigit(format, payload)` applies the correct positional weights
for each format (exposed as `SPEC`) and returns the full code with the check
digit appended. Spaces and hyphens are ignored, short payloads are
left-padded with zeros, and anything else (letters, too many digits) throws.
`validateBarcodeText` recomputes the check digit and also enforces the
expected digit count, UPC-E number system 0/1, and the ISBN-13 978/979
prefix.

UPC-E is the one exception to the positional weights: per GS1, its check
digit is computed on the expanded UPC-A form, which `computeCheckDigit` and
`validateBarcodeText` handle for you.

## Supported formats

**Fixed-length** (have a computable check digit):
`upca`, `upce`, `ean13`, `ean8`, `isbn`, `itf14`

**Variable-length** (no check digit — validation only rejects empty text,
and non-ASCII text for `code128` / `fnsku`):
`code128`, `datamatrix`, `fnsku`

Every function throws a descriptive error for an unknown format string.

## API

| Export | Description |
| --- | --- |
| `computeCheckDigit(format, payload)` | Returns payload + GS1 mod-10 check digit. Throws for variable-length formats, non-digits, or a payload longer than the format allows. |
| `validateBarcodeText(format, text)` | `{ ok: true }` or `{ ok: false, error }`. |
| `normalizeText(format, text)` | Upper-cases except Data Matrix (case-sensitive). |
| `upcEExpand(numSystem, comp)` | Expands a UPC-E body to its 11-digit UPC-A payload. Throws unless `numSystem` is 0/1 and `comp` is 6 digits. |
| `generateRandom(format)` | One random, structurally valid code. |
| `buildSequential(format, prefix, start, count)` | Contiguous run of check-digit-terminated codes. Throws up front on overflow, bad `start`/`count`, or a prefix that can't yield valid codes. |
| `isVariableLength(format)` / `isCaseSensitive(format)` | Format predicates. |
| `SPEC` | Payload length + positional weights per fixed-length format. |

## FAQ

### How do I calculate a UPC-A or EAN-13 check digit in JavaScript?

`computeCheckDigit("upca", payload)` or `computeCheckDigit("ean13", payload)`.
Pass the payload *without* the final digit and it returns the full,
check-digit-terminated code.

### How do I validate a barcode number?

`validateBarcodeText(format, text)` returns `{ ok: true }` or
`{ ok: false, error }`, checking both the digit count and the GS1 mod-10
check digit.

### How do I convert UPC-E to UPC-A?

`upcEExpand(numberSystem, sixDigitBody)` returns the equivalent 11-digit
UPC-A payload; run it through `computeCheckDigit("upca", …)` for the full
12-digit code.

### Does this generate barcode images?

No — by design. `barcode-core` is the numeric layer (check digits,
validation, code generation). Pair it with any SVG/canvas renderer for
visuals; the math here is what's hard to get right.

### Is ISBN-13 supported?

Yes, as the `isbn` format (13-digit ISBN with the GS1 mod-10 check digit, the
modern Bookland EAN form).

## Sponsor

This library is extracted from a commercial product and maintained in the open.
If it saves you the afternoon of re-deriving GS1 check-digit weights, please
consider **[sponsoring on GitHub](https://github.com/sponsors/x1ee7)** — it
directly funds maintenance, more symbologies, and keeping the math correct.

## License

MIT © [upcgen.com](https://upcgen.com)
