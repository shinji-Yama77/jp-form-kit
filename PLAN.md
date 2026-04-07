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

---

## Next Milestone: Open Source Contributor Workflow

The annotation-based workflow is the primary way contributors add new forms. This milestone standardises it so the repo is ready for external contributors.

### What needs to be built

#### 1. `FIELD_NAMES.md` (new)

Single source of truth for canonical annotation label names. Contributors type EXACT keys from this table inside Preview text boxes when annotating a PDF.

Content:

- Naming conventions: `lowercase_snake_case`, `_year/_month/_day` suffix for date splits, `_2` suffix for duplicate sections
- Table of 23 canonical keys with: key name, English description, Japanese label, example value, notes

Canonical key set (derived from juminhyo + tenin schemas):

```
name, furigana, address, phone
dob_year, dob_month, dob_day
application_year, application_month, application_day
submit_year, submit_month, submit_day
move_year, move_month, move_day
name_2, furigana_2, address_2, phone_2
dob_year_2, dob_month_2, dob_day_2
```

#### 2. `scripts/extract-annotations.mjs` (new — replaces `extract-coords.mjs`)

Generic CLI that reads FreeText annotations from any annotated PDF.

```
node scripts/extract-annotations.mjs <annotated-pdf-path> [--json]
```

- Filters by `subtype === "FreeText"`
- Extracts label via `ann.textContent?.join("").trim() ?? ann.contentsObj?.str?.trim()`
- Rounds rect values
- Outputs per annotation: `{ label, x, y, width, height, rect }` where `x=rect[0]`, `y=rect[1]`
- Validates label against embedded `CANONICAL_KEYS` Set — prints `⚠ UNKNOWN KEY` warning, does not exit non-zero
- `--json` flag: pure JSON array to stdout, warnings suppressed

Dependencies: `pdfjs-dist` (already in devDependencies), Node built-ins only.

#### 3. `scripts/test-overlay.mjs` (rewrite)

Replaces the hardcoded version. Reads annotations live from the annotated PDF, overlays sample data on the blank PDF.

```
node scripts/test-overlay.mjs <annotated-pdf-path> <blank-pdf-path> [output-path]
```

- Default output: `scripts/test-overlay-output.pdf`
- Font resolved via `FONT_PATH` env var, fallback `../public/fonts/NotoSansJP-Regular.ttf` relative to scripts dir
- Uses `fileURLToPath(import.meta.url)` for `__dirname` in ESM
- Per annotation: red border rect, sample value vertically centred (`y1 + (boxH - 9) / 2`), key label above box in blue at 5pt
- Unknown key: uses label string as value (visible, not silent)
- Sample data covers all 23 canonical keys with realistic Japanese values

Dependencies: `pdf-lib`, `@pdf-lib/fontkit`, `pdfjs-dist`, Node built-ins. No new packages needed.

#### 4. `CONTRIBUTING.md` — add "Annotation workflow" section

Replace `extract-coords.mjs` references with the two-step workflow. The six-step flow:

```
Step 1 — cp blank-form.pdf formid_annotated.pdf
Step 2 — Open in Preview → Tools → Annotate → Text
          Draw text box over each field, type the exact canonical key name
          See FIELD_NAMES.md for the full key list
Step 3 — node scripts/extract-annotations.mjs formid_annotated.pdf
          Verify no ⚠ UNKNOWN KEY warnings
Step 4 — node scripts/test-overlay.mjs formid_annotated.pdf blank-form.pdf
          Open output PDF, verify red boxes align with the correct fields
Step 5 — Write TypeScript schema using x=rect[0], y=rect[1] from extract output
Step 6 — Attach test-overlay output PDF to PR (required — reviewers cannot verify numbers alone)
```

Update PR checklist to require both scripts.

#### 5. Delete `scripts/extract-coords.mjs`

After `extract-annotations.mjs` is confirmed working. Not published to npm so no API concern.

### Files changed

| File                              | Action                                    |
| --------------------------------- | ----------------------------------------- |
| `FIELD_NAMES.md`                  | Create                                    |
| `scripts/extract-annotations.mjs` | Create                                    |
| `scripts/test-overlay.mjs`        | Rewrite                                   |
| `CONTRIBUTING.md`                 | Insert section + update script references |
| `scripts/extract-coords.mjs`      | Delete                                    |
