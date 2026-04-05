# jp-form-kit

[English](./README.md) | [日本語](./README.ja.md)

`jp-form-kit` is a TypeScript package for Japanese government PDF forms.

It ships:

- typed form schemas
- schema metadata and field coordinates
- a Node-first PDF overlay engine

The package is designed for apps and scripts that need to render values onto known blank Japanese government PDFs without rebuilding the schema and coordinate layer from scratch.

## What This Package Is

- A typed catalog of Japanese form schemas
- A PDF overlay engine for Node
- A reusable package for schema-driven Japanese form filling workflows

## What This Package Is Not

- Not a browser-first package
- Not a complete archive of Japanese forms
- Not a bundled collection of official blank PDFs

## Installation

```bash
npm install jp-form-kit
```

## Quick Example

```ts
import { renderOverlayPdfToFile } from "jp-form-kit";

await renderOverlayPdfToFile(
  "juminhyo",
  {
    name: "SMITH JOHN",
    address: "東京都港区六本木3-1-1",
    dob_year: "1990",
    dob_month: "03",
    dob_day: "15",
  },
  {
    assetRoot: "./pdfs",
    fontPath: "./fonts/NotoSansJP-Regular.ttf",
  },
  "./output/juminhyo-filled.pdf",
);
```

## Asset Folder Convention

The engine expects blank PDFs under a deterministic folder layout:

```text
{assetRoot}/{jurisdiction}/{schema.id}/{pdfFilename}
```

For example:

```text
pdfs/
  minato-ku/
    juminhyo/
      juminhyo.pdf
    tenin/
      tenin.pdf
```

If you pass:

```ts
{
  assetRoot: "./pdfs",
  fontPath: "./fonts/NotoSansJP-Regular.ttf",
}
```

then the engine will resolve `juminhyo` to:

```text
./pdfs/minato-ku/juminhyo/juminhyo.pdf
```

You can also inspect the expected path directly:

```ts
import { getPdfPath, juminhyoSchema } from "jp-form-kit";

const path = getPdfPath(juminhyoSchema, "./pdfs");
```

## Exports

The package currently exposes:

- `allForms`
- `FormCategory`
- `OverlayField`
- `FormVariant`
- `OverlayFormSchema`
- individual schema exports
- `renderOverlayPdf`
- `renderOverlayPdfToFile`
- `getPdfPath`
- `MissingPdfError`
- `MissingFontError`
- `UnknownSchemaError`

## Engine API

### `renderOverlayPdf(schema, values, options)`

Generates a filled PDF and returns the output bytes as `Uint8Array`.

- `schema`: an `OverlayFormSchema` object or schema id string such as `"juminhyo"`
- `values`: record of field key to drawn string value
- `options.assetRoot`: top-level folder containing the blank PDF tree
- `options.fontPath`: path to a Japanese-capable `.ttf` font

### `renderOverlayPdfToFile(schema, values, options, outputPath)`

Convenience wrapper that renders and writes the generated PDF to disk.

## Schema Shape

Each form schema includes:

- stable form metadata such as `id`, `titleJa`, `titleEn`, `category`, and `jurisdiction`
- provenance such as `sourceUrl`, `lastVerifiedAt`, and `verificationLocation`
- file hints such as `pdfFilename` and `downloadName`
- a `fields` array containing overlay coordinates and field labels

Field coordinates use PDF points with a bottom-left origin, matching common PDF drawing APIs such as `pdf-lib`.

## Project Structure

```text
src/
  index.ts
  types.ts
  forms/
    index.ts
    minato/
      index.ts
      juminhyo.ts
      tenin.ts
  engine/
    index.ts
    render.ts
    resolve-pdf.ts
    errors.ts

dist/
  generated build output published to npm

scripts/
  contributor tooling for inspecting PDFs, extracting coordinates, and testing overlays
```

## Verification Philosophy

This package is only useful if schemas are trustworthy.

- `sourceUrl` should point to the official government source for the form
- `lastVerifiedAt` should reflect a real verification date
- coordinates should come from a documented mapping workflow, not guesses
- updated PDFs may require coordinates to be remapped

## Contributing

Contributions are welcome, especially additional verified forms and coordinate fixes.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution workflow, coordinate mapping process, and schema conventions.

## Publish Model

The published npm package includes code in `dist/`. Blank source PDFs are not bundled into the package for v1; consumers are expected to keep them in a local asset directory that follows the documented convention.

## Status

This project is intentionally starting small. Early releases focus on a small number of high-value forms with verified metadata and a working Node overlay flow rather than broad coverage.
