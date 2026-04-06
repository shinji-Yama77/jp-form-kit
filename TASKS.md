# Tasks: Open Source Contributor Workflow

Implementation tasks derived from [SPEC.md](./SPEC.md). Work through these in order — each is a discrete, completable unit.

---

## 1. FIELD_NAMES.md

- [ ] Create `FIELD_NAMES.md` with naming conventions section and full 23-key canonical table

---

## 2. scripts/extract-annotations.mjs

- [ ] Create `scripts/extract-annotations.mjs` — reads FreeText annotations from any PDF via pdfjs-dist, prints `label / x / y / rect` per annotation
- [ ] Add canonical key validation with `⚠ UNKNOWN KEY` warnings (warn only, no non-zero exit)
- [ ] Add `--json` flag for machine-readable output to stdout (warnings suppressed)
- [ ] Delete `scripts/extract-coords.mjs` once confirmed working

---

## 3. scripts/test-overlay.mjs (rewrite)

- [ ] Rewrite `scripts/test-overlay.mjs` to accept `<annotated-pdf> <blank-pdf> [output-path]` args
- [ ] Read annotations live from annotated PDF using same pdfjs pattern as extract-annotations.mjs
- [ ] Overlay full `SAMPLE_DATA` map with red debug boxes + key labels on blank PDF
- [ ] Add `FONT_PATH` env var support with actionable error message if font not found

---

## 4. scripts/generate-schema.mjs

- [ ] Create `scripts/generate-schema.mjs` — reads annotated PDF, generates a TypeScript schema file skeleton
- [ ] Implement `--id`, `--jurisdiction`, `--pdf`, `--out` CLI flags
- [ ] Infer `vaultKey` for `_year` / `_month` / `_day` field suffixes (`dob_*` → `"dob"`, `move_*` → `"move_date"`)
- [ ] Populate `labelEn` / `labelJa` for known canonical keys
- [ ] Calculate correct relative import path depth from `--out` path
- [ ] No-overwrite guard: exit 1 if `--out` file already exists

---

## 5. scripts/test-render.mjs

- [ ] Create `scripts/test-render.mjs` — exercises full consumer path via `renderOverlayPdfToFile`
- [ ] Output a clean PDF with no debug marks; configurable via `FONT_PATH` + `ASSET_ROOT` env vars

---

## 6. CONTRIBUTING.md

- [ ] Add "Annotation workflow" 6-step section (annotate → extract → verify → generate → fill TODOs → attach PDF to PR)
- [ ] Add note that `test-overlay.mjs` debug boxes do not appear in production output from `renderOverlayPdf`
- [ ] Update PR checklist: add `extract-annotations.mjs` and `test-overlay.mjs` checkboxes
- [ ] Replace all remaining `extract-coords.mjs` references with `extract-annotations.mjs`
- [ ] Update `test-overlay.mjs` usage example to new two-argument signature

---

## 7. Tests

- [ ] Add `"test": "node --test"` script to `package.json`
- [ ] Create `tests/engine/resolve-pdf.test.mjs` — unit tests for `getPdfPath` and `resolvePdfBytes`:
  - correct path is constructed from `assetRoot + jurisdiction + id + pdfFilename`
  - `MissingPdfError` thrown with actionable message when file doesn't exist
  - `MissingFontError` thrown when font path is missing
- [ ] Create `tests/engine/render.test.mjs` — unit tests for `renderOverlayPdf`:
  - `UnknownSchemaError` thrown for an unrecognised schema id
  - fields with empty string values are skipped (not drawn)
  - fields with values produce a larger output than the blank input (basic sanity check)
- [ ] Create `tests/integration/juminhyo.test.mjs` — end-to-end test:
  - calls `renderOverlayPdfToFile("juminhyo", sampleValues, options)` with a real blank PDF and real font
  - output file is written and is a non-empty buffer
  - configurable via `FONT_PATH` + `ASSET_ROOT` env vars; skip with a clear message if assets not present
- [ ] Add `tests/` section to `CONTRIBUTING.md` explaining how to run tests and what env vars are needed

---

## 9. Verification

Run each of these and confirm it passes before marking done:

- [ ] `node scripts/extract-annotations.mjs public/forms/juminhyo_en.pdf` — 3 annotations printed, all show `⚠ UNKNOWN KEY`
- [ ] `node scripts/extract-annotations.mjs --json public/forms/juminhyo_en.pdf` — valid JSON array, no warnings in stdout
- [ ] `node scripts/test-overlay.mjs public/forms/juminhyo_en.pdf public/forms/juminhyo.pdf` — output PDF written; open and verify red boxes + sample text
- [ ] `node scripts/test-render.mjs` — output PDF written; open and confirm clean filled form, no debug marks
- [ ] Run `test-overlay.mjs` with bad font path — error names `FONT_PATH` env var
- [ ] Run `extract-annotations.mjs` with no args — usage message printed, exit 1
- [ ] `node scripts/generate-schema.mjs public/forms/juminhyo_en.pdf --id juminhyo --jurisdiction minato-ku --pdf juminhyo.pdf` — valid TypeScript printed to stdout with correct `vaultKey` inferences and `// TODO` placeholders
- [ ] Re-run above with `--out path/new-schema.ts` — file written; re-run again and confirm exit 1 (no overwrite)
- [ ] `npm run typecheck` — passes
