# jp-form-kit

`jp-form-kit` is a TypeScript library of typed overlay schemas for Japanese government PDF forms.

It is designed for apps that need to prefill or review flat PDF forms by drawing text at known `x/y` coordinates. The package publishes form metadata, field definitions, and TypeScript types. It does not ship a PDF renderer or overlay engine.

## What This Package Is

- A typed catalog of Japanese form schemas
- A source of `x/y` field coordinates for PDF overlay workflows
- A small zero-runtime-dependency TypeScript package

## What This Package Is Not

- Not an SDK
- Not a PDF rendering library
- Not a browser UI
- Not a complete archive of Japanese forms

## Installation

```bash
npm install jp-form-kit
```

## Quick Example

```ts
import { allForms, type OverlayFormSchema } from "jp-form-kit";

const form: OverlayFormSchema | undefined = allForms.find(
  (schema) => schema.id === "juminhyo",
);

if (form) {
  console.log(form.titleEn);
  console.log(form.pdfFilename);
  console.log(form.fields.map((field) => field.key));
}
```

## Exports

The package currently exposes:

- `allForms`
- `FormCategory`
- `OverlayField`
- `FormVariant`
- `OverlayFormSchema`
- Individual schema exports re-exported from `src/forms/`

## Schema Shape

Each form schema includes:

- Stable form metadata such as `id`, `titleJa`, `titleEn`, `category`, and `jurisdiction`
- Source provenance such as `sourceUrl`, `lastVerifiedAt`, and `verificationLocation`
- PDF file hints such as `pdfFilename` and `downloadName`
- A `fields` array containing overlay coordinates and field labels

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

dist/
  generated build output published to npm

scripts/
  contributor tooling for inspecting PDFs, extracting coordinates, and testing overlays
```

## Verification Philosophy

This package is only useful if schemas are trustworthy.

- `sourceUrl` should point to the official government source for the form
- `lastVerifiedAt` should reflect a real verification date
- Coordinates should come from a documented mapping workflow, not guesses
- Updated PDFs may require coordinates to be remapped

## Contributing

Contributions are welcome, especially additional verified forms and coordinate fixes.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the contribution workflow, coordinate mapping process, and schema conventions.

## Publish Model

The published npm package includes only `dist/`. Source files, local tooling, and contributor documentation stay in the repository but are not part of the runtime package.

## Status

This project is intentionally starting small. Early releases focus on a small number of high-value forms with verified metadata and clear type definitions rather than broad coverage.
