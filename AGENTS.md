# AGENTS.md — Instructions for AI agents working in this repo

This file tells Claude Code (and other AI coding agents) how this repo works, what's in it, and how to contribute correctly.

---

## What this repo is

`jp-form-kit` is a TypeScript npm package. It contains:

1. **TypeScript types** — `OverlayFormSchema`, `OverlayField`, `FormCategory` in `src/types.ts`
2. **Form schemas** — plain TypeScript objects describing the fields of Japanese government forms, organized by ward/institution under `src/forms/`
3. **Contributor scripts** — Node.js + browser tools in `scripts/` for authoring new schemas (not published to npm)

---

## Repo structure

```text
src/
  types.ts              canonical type definitions — edit carefully, breaking changes = major version bump
  forms/
    minato/             forms from 港区役所 and related Minato ward institutions
      juminhyo.ts       住民票等請求書
      index.ts          re-exports all minato schemas
    index.ts            re-exports all forms + exports allForms array
  index.ts              public package entry — only this file and what it re-exports is public API

scripts/                contributor tooling — NOT part of the published package
  extract-annotations.mjs reads a Preview-annotated PDF → prints annotation rects
  coord-picker.html     browser canvas tool — click PDF to record x/y coordinates
  generate-schema.mjs   creates or augments schemas from annotated PDFs
  test-overlay.mjs      draws bounding boxes on a PDF to verify schema coordinates
```

---

## Core types — read these before touching anything

```typescript
// src/types.ts

export type FormCategory =
  | "ward"
  | "immigration"
  | "pension"
  | "employment"
  | "banking"
  | "housing";

export interface OverlayField {
  key: string; // unique within the form — used as lookup key in the values map
  x: number; // PDF x coordinate, bottom-left origin, in points
  y: number; // PDF y coordinate
  size?: number; // font size override (default 9pt used by the overlay engine)
  labelEn?: string; // English label for review UIs
  labelJa?: string; // Japanese label for review UIs
}

export interface FormVariant {
  lang: "ja" | "en"; // language of this PDF version
  pdfFilename: string; // filename for this language's PDF
  sourceUrl: string; // URL where this specific PDF version was obtained
  lastVerifiedAt: string; // ISO 8601 date (YYYY-MM-DD) for this specific variant PDF
  fields?: OverlayField[]; // optional variant-specific coordinates when layouts differ
}

export interface OverlayFormSchema {
  id: string; // kebab-case, unique across all schemas
  titleJa: string; // official Japanese form title for display and review UIs
  titleEn: string; // English display title or translation for consumers that need it
  pdfFilename: string; // just the filename — consumer app controls the base path
  sourceUrl: string; // real government URL — must be verifiable
  category: FormCategory;
  jurisdiction: string; // filterable issuer slug — e.g. "minato-ku", "national", "immigration-bureau"
  lastVerifiedAt: string; // ISO 8601 date (YYYY-MM-DD)
  variants?: FormVariant[]; // additional language versions — variants may override coordinates when layouts differ
  fields: OverlayField[];
}
// NOTE: `free: boolean` from the original SmartLayer app has been removed — app-specific pricing
// NOTE: `pdfUrl` renamed to `pdfFilename` — apps control their own asset paths
```

---

## How coordinates work

Japanese government PDFs are almost always **flat** (no AcroForm fields). Coordinates are placed by:

1. Opening the PDF in **macOS Preview**
2. Adding text annotations (Tools → Annotate → Text) with the field key name typed inside
3. Running `node scripts/extract-annotations.mjs path/to/annotated.pdf`
4. Script outputs `label / x / y / rect` per annotation; unknown keys are flagged with `⚠ UNKNOWN KEY`
5. Schema uses `x`, `y` from the annotation's bottom-left corner
6. Verify with `FONT_PATH=... node scripts/test-overlay.mjs annotated.pdf blank.pdf --values ...` — draws red boxes on the blank PDF
7. Generate or update a schema with `node scripts/generate-schema.mjs` (see CONTRIBUTING.md)

**Coordinate system**: PDF points, origin at bottom-left of the page. x increases right, y increases up. This matches `pdf-lib`'s drawing API.

---

## Rules for agents

### What you CAN do freely

- Add new form schema files under `src/forms/`
- Update `lastVerifiedAt` on existing schemas when re-verifying
- Fix coordinates on existing schemas (patch version change)
- Add new exports to `index.ts` files
- Update `scripts/` tooling
- Fix typos in `labelEn`, `labelJa`, `titleEn`

### What requires care

- **`src/types.ts`** — adding optional fields to interfaces is fine (minor version). Renaming or removing fields is a breaking change (major version). Never change types without updating the version in `package.json`.
- **Existing field `key` values** — never rename a `key` in an already-published schema. Consumer apps reference keys by name. Renaming is a breaking change.
- **`sourceUrl`** — must always be a real, working URL to the official government source. Never invent or guess URLs.
- **`lastVerifiedAt`** — only set this to a date when the schema has actually been checked against the live form. Do not set it to today's date speculatively.
- **Base vs variant language** — the first verified PDF becomes the base schema. Later verified language versions should usually be added in `variants` rather than rebasing the existing schema.
- **Variant filenames** — when contributors need a short filename for a later language variant, prefer `{schema-id}-{lang}.pdf` such as `juminhyo-en.pdf`.

### What you must NOT do

- Do not add runtime dependencies to the package (no imports in `src/` from npm packages)
- Do not commit PDF files to the repo
- Do not generate or guess `x/y` coordinates — they must come from the annotation workflow (`extract-annotations.mjs`)
- Do not modify `dist/` manually — it is generated by `npm run build`
- Do not create schemas for forms that have not been verified against a real PDF

---

## Adding a new form schema

When asked to scaffold a new form, do this:

1. Create `src/forms/{ward}/{form-id}.ts` with the `OverlayFormSchema` structure
2. Leave `fields: []` and add a comment `// TODO: coordinates need to be mapped via extract-coords.mjs workflow`
3. Do not add the schema until it has been verified against a real PDF and can carry a real `lastVerifiedAt` date
4. Export it from `src/forms/{ward}/index.ts` and `src/forms/index.ts`
5. Add it to the `allForms` array in `src/forms/index.ts`

Never fill in `x`/`y` values unless given real coordinates from the workflow output. Guessed coordinates will silently produce misaligned overlays.

---

## scripts/ — what each script does

| Script | Purpose |
| ------ | ------- |

| `extract-annotations.mjs` | Reads a Preview-annotated PDF using `pdfjs-dist`. Prints `label / x / y / rect` per FreeText annotation. Flags unknown canonical keys. Accepts `--json` for machine-readable output. |
| `generate-schema.mjs` | Creates a new schema from one annotated PDF or augments an existing schema with a later language variant. Accepts `--id`, `--jurisdiction`, `--pdf`, `--out`, optional `--meta`, and optional `--force` in new-schema mode, or `--variant-for`, `--variant-lang`, `--pdf`, optional `--meta`, optional `--out`, and optional `--force` in variant mode. |
| `test-overlay.mjs` | Takes `<annotated-pdf> <blank-pdf> [output-path] [--values values.json]`. Reads annotations from the annotated PDF, then draws red bounding boxes and sample values onto the blank PDF. Set `FONT_PATH` to a Japanese-capable `.ttf` font. |

These scripts use `pdf-lib`, `pdfjs-dist`, and `fontkit` which are in `devDependencies`. They are never published.

---

## Build and publish

```bash
npm run build     # compiles src/ → dist/ using tsconfig.build.json
npm run typecheck # runs tsc --noEmit to check types without building
npm pack          # preview what gets published — should only contain dist/ + README + LICENSE
npm publish --access public
```

The `files` field in `package.json` controls what's published. Only `dist/` is included. Everything else (src, scripts, docs) is excluded.

---

## Version bumps

| Change type                                                       | Version bump  |
| ----------------------------------------------------------------- | ------------- |
| New form schema added                                             | patch (0.1.x) |
| Existing schema coordinates fixed                                 | patch         |
| `lastVerifiedAt` updated                                          | patch         |
| New optional field added to `OverlayField` or `OverlayFormSchema` | minor (0.x.0) |
| New `FormCategory` value added                                    | minor         |
| Any field renamed or removed from types                           | major (x.0.0) |
| Any existing schema field `key` renamed                           | major         |

Always update `version` in `package.json` before publishing.
