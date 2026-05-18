# @upcgen/barcode-core

[![CI](https://github.com/x1ee7/barcode-core/actions/workflows/ci.yml/badge.svg)](https://github.com/x1ee7/barcode-core/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@upcgen/barcode-core.svg)](https://www.npmjs.com/package/@upcgen/barcode-core)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4- db61a2)](https://github.com/sponsors/x1ee7)

**Zero-dependency** UPC / EAN / ISBN / ITF-14 check-digit math, validation,
UPC-E expansion, and random / sequential code generation.

This is the production barcode engine behind **[upcgen.com](https://upcgen.com)** —
the rendering layer stays in the app; the math is open.

## Install

```sh
npm install @upcgen/barcode-core
```

## Usage

```ts
import {
  computeCheckDigit,
  validateBarcodeText,
  upcEExpand,
  generateRandom,
  buildSequential,
} from "@upcgen/barcode-core";

// Append the GS1 mod-10 check digit
computeCheckDigit("upca", "03600029145");   // → "036000291452"
computeCheckDigit("ean13", "978013110362"); // → "9780131103627"

// Validate digit count + check digit
validateBarcodeText("upca", "036000291452"); // → { ok: true }
validateBarcodeText("upca", "036000291450"); // → { ok: false, error: "invalid check digit — expected 2, got 0" }

// UPC-E (6-digit body + number system) → 11-digit UPC-A payload
upcEExpand("0", "123455"); // → "01234500005"

// One random, structurally valid code
generateRandom("ean13"); // → e.g. "4006381333931"

// A contiguous run sharing a prefix, each with a valid check digit
buildSequential("ean13", "978", 1, 3);
// → ["9780000000012", "9780000000029", "9780000000036"]
```

## API

| Export | Description |
| --- | --- |
| `computeCheckDigit(format, payload)` | Returns payload + GS1 mod-10 check digit. Throws for variable-length formats. |
| `validateBarcodeText(format, text)` | `{ ok: true }` or `{ ok: false, error }`. Variable-length formats always pass. |
| `normalizeText(format, text)` | Upper-cases except Data Matrix (case-sensitive). |
| `upcEExpand(numSystem, comp)` | Expands a UPC-E body to its 11-digit UPC-A payload. |
| `generateRandom(format)` | One random, structurally valid code. |
| `buildSequential(format, prefix, start, count)` | Contiguous run of check-digit-terminated codes. |
| `isVariableLength(format)` / `isCaseSensitive(format)` | Format predicates. |
| `SPEC` | Payload length + positional weights per fixed-length format. |

**Fixed-length:** `upca`, `upce`, `ean13`, `ean8`, `isbn`, `itf14`
**Variable-length:** `code128`, `datamatrix`, `fnsku`

## Sponsor

This library is extracted from a commercial product and maintained in the open.
If it saves you the afternoon of re-deriving GS1 check-digit weights, please
consider **[sponsoring on GitHub](https://github.com/sponsors/x1ee7)** — it
directly funds maintenance, more symbologies, and keeping the math correct.

## License

MIT © [upcgen.com](https://upcgen.com)
