# jp-form-kit — Project Plan

## What This Is

`jp-form-kit` is an open-source TypeScript npm package for Japanese government PDF forms.

The v1 goal is no longer a pure schema registry. The package should ship:

- canonical form schemas
- a Node-first PDF overlay engine
- deterministic local PDF asset resolution owned by the app/package setup

This project was extracted from app-specific code so the schema definitions and overlay behavior can be maintained in one reusable package instead of being buried inside a single app.

---

## v1 Direction

### Product shape

For v1, `jp-form-kit` stays as one package.

It should expose:

- form schemas and schema types
- `allForms`
- a generic overlay engine that can render text onto the correct blank form PDF in Node

It should not require consumers to manually choose an arbitrary blank PDF in normal usage. The engine should resolve the expected PDF using known schema metadata and a controlled local asset directory.

### Scope

v1 should prioritize completeness over breadth:

- ship 2-3 high-value forms end-to-end
- prove schema format, asset resolution, and rendering flow
- keep browser support out of scope for now
- add more forms only after the engine/package shape is stable

---

## Goals for v1

- Publish to npm as `jp-form-kit`
- Keep schema exports available from the package root
- Keep `allForms` available from the package root
- Add a Node-first overlay engine to the same package
- Support deterministic local PDF resolution using schema metadata such as `pdfFilename`
- Produce a usable overlaid PDF for 2-3 verified forms
- Keep contributor workflows for coordinate mapping and verification documented

### Explicit non-goals for v1

- No browser-first API
- No bundled official PDFs in the npm package
- No monorepo split into separate schema and engine packages
- No requirement for users to supply arbitrary blank PDFs in the default flow

---

## High-Level Repo Shape

```text
jp-form-kit/
  src/
    index.ts                 public package entry
    types.ts                 canonical schema types
    forms/
      index.ts               re-exports forms + allForms
      minato/
        index.ts
        juminhyo.ts
        tenin.ts
        ...                  at most 1 additional v1 form
    engine/
      index.ts               engine public exports
      render.ts              core overlay rendering
      resolve-pdf.ts         local asset resolution
      errors.ts              runtime error helpers/messages
  scripts/
    extract-coords.mjs
    coord-picker.html
    inspect-pdf.mjs
    test-overlay.mjs
  README.md
  CONTRIBUTING.md
  AGENTS.md
  PLAN.md
```

### Asset strategy

- Blank source PDFs are not committed to npm package output for v1
- Blank source PDFs live in a controlled local asset directory owned by the app or local setup
- Engine resolution should use schema metadata and a known asset root, not arbitrary user-chosen PDFs
- PDF redistribution is deferred until legal and packaging questions are explicitly resolved

---

## Public API Direction

The package root should continue to export schema types and form definitions.

### Existing exports to preserve

- `allForms`
- `FormCategory`
- `OverlayField`
- `FormVariant`
- `OverlayFormSchema`
- individual schema exports

### New engine exports to add

The package should add an engine entry point that supports either a schema id or a schema object plus a values map.

The intended API shape is:

- a core function that generates PDF bytes in Node
- a thin helper that optionally writes those bytes to disk
- optional engine options for things like asset root and font path/bytes

### Core behavior

The engine should:

1. resolve the schema if given a schema id
2. resolve the matching blank PDF from a known local asset root
3. load a Japanese-capable font
4. draw all non-empty mapped values onto the PDF using schema coordinates
5. return generated PDF bytes

### Design constraints

- core generator should not depend on DOM APIs
- default path should be Node-oriented and file-system-friendly
- error messages should clearly explain missing asset files, missing fonts, and unknown schema ids
- asset resolution should be deterministic and based on package/app configuration, not ad hoc caller choices

---

## Runtime and Dependency Direction

The old “zero runtime dependencies” promise no longer applies to the package if the engine ships in v1.

The revised package direction is:

- schema definitions remain plain typed data
- the overlay engine introduces runtime PDF dependencies
- contributor scripts stay separate from runtime engine code

This means the package should be described as a schema library plus canonical renderer, not a types-only package.

---

## Contributor Workflow

The coordinate authoring workflow remains important and should stay documented.

### Current workflow to preserve

1. obtain the official blank PDF from the official source
2. inspect whether it is AcroForm or flat
3. map coordinates using Preview annotations or the coord picker
4. verify placement with the test overlay script
5. add or update the schema in `src/forms/`

### Contributor expectations

- coordinates must come from the documented workflow, not guesswork
- `sourceUrl` must be a real official source URL
- `lastVerifiedAt` should only be updated after real verification
- verification docs and contributor docs should stay aligned with the engine-enabled package direction

---

## Acceptance Criteria

The project is ready for v1 when all of the following are true:

- `npm run typecheck` passes
- `npm run build` produces a usable package
- 2-3 forms are fully wired end-to-end through the engine
- given a schema id and values, the engine can resolve the correct local blank PDF and generate an overlay PDF in Node
- the generated output uses a Japanese-capable font
- all non-empty mapped fields are drawn using the schema coordinates
- coordinate verification workflow remains documented
- `README.md` and `CONTRIBUTING.md` match the actual package direction

### Minimum smoke scenarios

- generate overlay PDF for `juminhyo`
- generate overlay PDF for `tenin`
- fail clearly when the expected local source PDF is missing
- fail clearly when required font configuration is missing
- fail clearly when a schema id is unknown

---

## Versioning Direction

- Patch: add a form, fix coordinates, update verification metadata, improve runtime behavior without breaking API
- Minor: add optional schema fields, add engine options, add non-breaking API surface
- Major: rename/remove exported types, rename existing schema field keys, or break engine API expectations

Renaming a published field key is still a breaking change.

---

## Assumptions and Defaults

- Package name stays `jp-form-kit`
- v1 stays as one package
- runtime target is Node first
- blank source PDFs are resolved from controlled local assets
- PDFs are not bundled into npm for v1
- PDF redistribution is deferred
- v1 should stop at 2-3 excellent forms rather than stretching to broad coverage
