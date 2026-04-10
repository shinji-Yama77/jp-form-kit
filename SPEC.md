# Spec: Open Source Contributor Workflow

## Goal

Make `jp-form-kit` easy to contribute to. The core idea: contributors annotate a blank government PDF in macOS Preview with field key names as text boxes, run two scripts to extract and verify coordinates, then write the TypeScript schema. No code knowledge required to map a new form.

This spec covers the four things needed to ship this workflow cleanly.

---

## 1. `FIELD_NAMES.md`

**Action:** Create  
**Path:** `FIELD_NAMES.md`

The single source of truth for what label names are valid inside annotation text boxes. Contributors must use EXACT key names from this file when annotating PDFs.

### Naming conventions

- All keys are `lowercase_snake_case`
- Use `_year` / `_month` / `_day` suffix to split a date field into three boxes
- Use `_2` suffix for a second person or duplicate section on the same form (e.g. `name_2`, `dob_year_2`)
- Never invent new keys without updating this file and opening a discussion issue first

### Canonical key table

| Key                 | English Description      | Japanese Label    | Example Value         | Notes                            |
| ------------------- | ------------------------ | ----------------- | --------------------- | -------------------------------- |
| `name`              | Full Name                | 氏名              | 田中 太郎             | Primary applicant                |
| `furigana`          | Name (Katakana)          | フリガナ          | タナカ タロウ         | Primary applicant                |
| `address`           | Current Address          | 現住所 / 住所     | 東京都港区六本木1-1-1 | Primary applicant                |
| `phone`             | Phone Number             | 電話番号          | 090-1234-5678         | Primary applicant                |
| `dob_year`          | Birth Year               | 生年月日（年）    | 1990                  |                                  |
| `dob_month`         | Birth Month              | 生年月日（月）    | 05                    |                                  |
| `dob_day`           | Birth Day                | 生年月日（日）    | 15                    |                                  |
| `application_year`  | Application Year         | 申請年            | 2026                  | Date form is submitted           |
| `application_month` | Application Month        | 申請月            | 04                    | Date form is submitted           |
| `application_day`   | Application Day          | 申請日            | 06                    | Date form is submitted           |
| `submit_year`       | Submission Year          | 届出年            | 2026                  | Alternative submission date key  |
| `submit_month`      | Submission Month         | 届出月            | 04                    |                                  |
| `submit_day`        | Submission Day           | 届出日            | 06                    |                                  |
| `move_year`         | Move-in Year             | 転入年            | 2026                  |                                  |
| `move_month`        | Move-in Month            | 転入月            | 04                    |                                  |
| `move_day`          | Move-in Day              | 転入日            | 06                    |                                  |
| `name_2`            | Full Name (Person 2)     | 氏名（2人目）     | 田中 花子             | Second person / household member |
| `furigana_2`        | Name Katakana (Person 2) | フリガナ（2人目） | タナカ ハナコ         |                                  |
| `address_2`         | Address (Person 2)       | 住所（2人目）     | 東京都港区六本木1-1-1 |                                  |
| `phone_2`           | Phone (Person 2)         | 電話番号（2人目） | 090-8765-4321         |                                  |
| `dob_year_2`        | Birth Year (Person 2)    | 生年（2人目）     | 1992                  |                                  |
| `dob_month_2`       | Birth Month (Person 2)   | 生月（2人目）     | 08                    |                                  |
| `dob_day_2`         | Birth Day (Person 2)     | 生日（2人目）     | 20                    |                                  |

---

## 2. `scripts/extract-annotations.mjs`

**Action:** Create (replaces `extract-coords.mjs`)  
**Path:** `scripts/extract-annotations.mjs`

Generic CLI that reads FreeText annotations from any annotated PDF and outputs field coordinates.

### Interface

```
node scripts/extract-annotations.mjs <annotated-pdf-path> [--json]
```

### Behaviour

- Reads all annotations from page 1 using `pdfjs-dist`
- Filters to `subtype === "FreeText"` only (ignores links and other annotation types already in the source PDF)
- Extracts label text via: `ann.textContent?.join("").trim() ?? ann.contentsObj?.str?.trim() ?? ""`
- Rounds all rect values via `.map(Math.round)`
- Outputs each annotation as: `{ label, x, y, width, height, rect }` where `x = rect[0]`, `y = rect[1]` (bottom-left corner, PDF coordinate system)

### Validation

An embedded `CANONICAL_KEYS` Set is compared against each extracted label:

```js
const CANONICAL_KEYS = new Set([
  "name",
  "furigana",
  "address",
  "phone",
  "dob_year",
  "dob_month",
  "dob_day",
  "application_year",
  "application_month",
  "application_day",
  "submit_year",
  "submit_month",
  "submit_day",
  "move_year",
  "move_month",
  "move_day",
  "name_2",
  "furigana_2",
  "address_2",
  "phone_2",
  "dob_year_2",
  "dob_month_2",
  "dob_day_2",
]);
```

- Unknown labels print `⚠ UNKNOWN KEY — check FIELD_NAMES.md` inline
- Does not exit non-zero on unknown keys — contributors may be iterating
- `--json` flag: outputs a pure JSON array to stdout, warnings suppressed (safe to pipe)

### Default output (human-readable)

```
PDF: /path/to/formid_annotated.pdf
Page size: 595 x 842 pts
Found 3 FreeText annotations:

  label: "name"
  x: 83, y: 708, width: 291, height: 16
  rect: [83, 708, 374, 724]

  label: "address"
  x: 91, y: 672, width: 480, height: 16
  rect: [91, 672, 571, 688]

  label: "phone"
  x: 419, y: 639, width: 154, height: 16
  rect: [419, 639, 573, 655]
```

### Dependencies

| Import                            | Source                       |
| --------------------------------- | ---------------------------- |
| `pdfjs-dist/legacy/build/pdf.mjs` | already in `devDependencies` |
| `fs`, `path`                      | Node built-ins               |

No new packages needed.

---

## 3. `scripts/test-overlay.mjs`

**Action:** Full rewrite  
**Path:** `scripts/test-overlay.mjs`

Replaces the hardcoded version. Reads annotations live from the annotated PDF and overlays sample data on the blank PDF for visual verification.

### Interface

```
node scripts/test-overlay.mjs <annotated-pdf-path> <blank-pdf-path> [output-path]
```

- Default output path: `scripts/test-overlay-output.pdf`
- Font resolved via `FONT_PATH` env var, with fallback `../public/fonts/NotoSansJP-Regular.ttf` relative to the scripts directory
- Uses `fileURLToPath(import.meta.url)` + `dirname` for `__dirname` equivalent in ESM

If font is not found: print an actionable error naming the `FONT_PATH` env var and exit 1.

### Annotation extraction

Uses the same pdfjs pattern as `extract-annotations.mjs` — filter FreeText, extract label via `textContent`, round rects. This keeps both scripts consistent and avoids a hard dependency between them.

### Sample data map

```js
const SAMPLE_DATA = {
  name: "田中 太郎",
  furigana: "タナカ タロウ",
  address: "東京都港区六本木1-1-1",
  phone: "090-1234-5678",
  dob_year: "1990",
  dob_month: "05",
  dob_day: "15",
  application_year: "2026",
  application_month: "04",
  application_day: "06",
  submit_year: "2026",
  submit_month: "04",
  submit_day: "06",
  move_year: "2026",
  move_month: "04",
  move_day: "06",
  name_2: "田中 花子",
  furigana_2: "タナカ ハナコ",
  address_2: "東京都港区六本木1-1-1",
  phone_2: "090-8765-4321",
  dob_year_2: "1992",
  dob_month_2: "08",
  dob_day_2: "20",
};
```

### Rendering per annotation

For each extracted annotation:

1. Draw a red 0.5pt border rectangle at `[x1, y1, width, height]`
2. Draw sample value (or label string if no sample entry) vertically centred: `y = y1 + (boxH - 9) / 2`, size 9pt, black
3. Draw the key label above the box: `y = y2 + 2`, size 5pt, blue `rgb(0, 0.4, 0.9)`

Unknown key labels fall back to using the label itself as the drawn value — this makes unknown fields visible rather than blank.

### Dependencies

| Import                            | Source                       |
| --------------------------------- | ---------------------------- |
| `pdf-lib`                         | already in `dependencies`    |
| `@pdf-lib/fontkit`                | already in `dependencies`    |
| `pdfjs-dist/legacy/build/pdf.mjs` | already in `devDependencies` |
| `fs`, `path`, `url`               | Node built-ins               |

No new packages needed.

---

## 4. `CONTRIBUTING.md` updates

**Action:** Insert section + update script references

### New "Annotation workflow" section

Insert after the existing "Option A" (Preview annotation) content in Step 3. The six-step flow:

**Step 1 — Duplicate the blank PDF**

```
cp official-form.pdf formid_annotated.pdf
```

Do not annotate the original. Name the annotated copy `{formid}_annotated.pdf`.

**Step 2 — Add FreeText annotations in Preview**

Tools → Annotate → Text. Draw a text box over each fillable field. Type the exact canonical key name inside (see [FIELD_NAMES.md](./FIELD_NAMES.md)). The text box should cover the same area a user would write in. Save when done (Cmd+S).

**Step 3 — Verify extracted annotations**

```
node scripts/extract-annotations.mjs formid_annotated.pdf
```

Check that every field is listed and there are no `⚠ UNKNOWN KEY` warnings. Fix label typos in Preview if any appear.

**Step 4 — Visual verification**

```
node scripts/test-overlay.mjs formid_annotated.pdf blank-form.pdf
```

Opens (writes) `scripts/test-overlay-output.pdf`. Open it and confirm every red bounding box sits correctly over the intended field. Adjust in Preview and re-run if anything is off.

An optional output path can be specified:

```
node scripts/test-overlay.mjs annotated.pdf blank.pdf output/verify-juminhyo.pdf
```

**Step 5 — Generate the schema**

```
node scripts/generate-schema.mjs formid_annotated.pdf \
  --id formid \
  --jurisdiction ward-slug \
  --pdf blank-form.pdf \
  --out src/forms/ward/formid.ts
```

This writes a TypeScript schema file with all field coordinates pre-filled from the annotations. Fill in any remaining metadata placeholders and you're done.

If `--out` is omitted the schema is printed to stdout so you can preview it first.

**Step 6 — Attach the verification PDF to your PR**

Drag `test-overlay-output.pdf` into the PR description. This is required — reviewers cannot verify coordinate correctness from numbers alone.

### PR checklist additions

Add two new checkboxes to the existing PR checklist:

- [ ] Ran `extract-annotations.mjs` — no unknown key warnings
- [ ] Ran `test-overlay.mjs` — output PDF attached to this PR

### Script reference updates

Replace any remaining references to `extract-coords.mjs` with `extract-annotations.mjs`. Update the `test-overlay.mjs` usage example to the new two-argument signature (`annotated-pdf blank-pdf` instead of `source output`).

---

## 5. `scripts/generate-schema.mjs` (new)

**Action:** Create  
**Path:** `scripts/generate-schema.mjs`

Reads the annotated PDF and generates a ready-to-edit TypeScript schema file. Contributors run this after step 3 of the annotation workflow instead of writing the schema by hand. The output is a `.ts` file they can drop straight into `src/forms/{jurisdiction}/`.

### Interface

```
node scripts/generate-schema.mjs <annotated-pdf-path> \
  --id <form-id> \
  --jurisdiction <jurisdiction-slug> \
  --pdf <blank-pdf-filename> \
  [--out <output-path>]
```

Example:

```
node scripts/generate-schema.mjs forms/juminhyo_annotated.pdf \
  --id juminhyo \
  --jurisdiction minato-ku \
  --pdf juminhyo.pdf \
  --out src/forms/minato/juminhyo.ts
```

All four flags are required except `--out`. Without `--out`, the generated TypeScript is printed to stdout.

### What it generates

Given the above command and three annotations (`name`, `address`, `phone`), the output is:

```ts
import type { OverlayFormSchema } from "../../types.js";

export const juminhyoSchema: OverlayFormSchema = {
  id: "juminhyo",
  titleJa: "", // TODO: fill in official Japanese form title
  titleEn: "", // TODO: fill in English translation
  pdfFilename: "juminhyo.pdf",
  sourceUrl: "", // TODO: official government URL
  category: "ward", // TODO: ward | immigration | pension | employment | banking | housing
  jurisdiction: "minato-ku",
  lastVerifiedAt: "", // TODO: set to YYYY-MM-DD after verifying against the live form
  fields: [
    { key: "name", x: 83, y: 708 },
    { key: "address", x: 91, y: 672 },
    { key: "phone", x: 419, y: 639 },
  ],
};
```

### Generation rules

**Import path depth** — inferred from `--out` path. Count how many directories deep the output file is under `src/` and generate the right relative import:

- `src/forms/minato/foo.ts` → `../../types.js` (2 levels up)
- `src/forms/foo.ts` → `../types.js` (1 level up)
- If `--out` not provided or depth can't be determined → use `"../../types.js"` with a comment `// adjust import path if needed`

**Export name** — camelCase the `--id` value + `Schema` suffix: `juminhyo` → `juminhyoSchema`, `kenko-hoken` → `kenkoHokenSchema`

**`category` default** — default to `"ward"` with a `// TODO` comment listing all valid values

**`labelEn` / `labelJa`** — populated from the `FIELD_NAMES.md` canonical key table for known keys. Unknown keys get no labels.

Do not infer required-vs-optional status from the PDF unless the repo explicitly reintroduces that metadata later. Field objects should stay objective: keys, coordinates, and labels only.

**Field alignment** — align the `x:` and `y:` values in columns for readability (same style as existing schemas).

**Unknown keys** — included as-is with a trailing comment:

```ts
{ key: "some_unknown_key", x: 100, y: 200 }, // ⚠ unknown key — check FIELD_NAMES.md
```

### `--out` behaviour

- If `--out` path doesn't exist, write the file
- If `--out` path already exists, print an error and exit 1 — never overwrite an existing schema
- Create intermediate directories if needed

### Dependencies

`pdfjs-dist` (already in devDependencies), `fs`, `path`, `url` — Node built-ins only.

---

## 6. Delete `scripts/extract-coords.mjs`

**Action:** Delete after `extract-annotations.mjs` is confirmed working.

The file is not published to npm (`"files": ["dist"]` in `package.json`) so there is no API concern. It had a hardcoded path to `juminhyo_en.pdf` and no CLI interface — `extract-annotations.mjs` supersedes it entirely.

---

## 6. Consumer output vs contributor verification

This distinction is critical and must be clear in documentation:

### `test-overlay.mjs` — contributor verification only

The red bounding boxes and key labels drawn by `test-overlay.mjs` are **debug output for contributors only**. They exist to confirm that coordinates land on the correct fields before a schema is merged. This script is never called by consumers.

### `renderOverlayPdf` — clean production output

When a consumer uses the package engine (`renderOverlayPdf` / `renderOverlayPdfToFile` from `src/engine/render.ts`), the output is a **clean, printable PDF** — just the blank form with text drawn at the field coordinates. No boxes, no labels, no debug marks.

```ts
import { renderOverlayPdfToFile } from "jp-form-kit";

await renderOverlayPdfToFile(
  "juminhyo",
  {
    name: "田中 太郎",
    furigana: "タナカ タロウ",
    address: "東京都港区六本木1-1-1",
    phone: "090-1234-5678",
    dob_year: "1990",
    dob_month: "05",
    dob_day: "15",
    application_year: "2026",
    application_month: "04",
    application_day: "06",
  },
  {
    assetRoot: "./pdfs",
    fontPath: "./fonts/NotoSansJP-Regular.ttf",
  },
  "./output/juminhyo-filled.pdf",
);
```

The output `juminhyo-filled.pdf` is the official blank form with the user's data overlaid — ready to print and hand to the ward office.

### What CONTRIBUTING.md must make clear

Add a note at the top of the "Annotation workflow" section:

> The `test-overlay.mjs` script draws red debug boxes and key labels to help you verify field alignment. **These do not appear in production output.** The render engine draws only text, using the coordinates you define in the schema.

---

## 7. Testing

### What to test

There are no automated tests yet. The minimum needed before open sourcing:

**Script smoke tests (manual, documented in CONTRIBUTING.md)**

- `inspect-pdf.mjs` — run against a flat PDF, confirm "No AcroForm fields" output
- `extract-annotations.mjs` — run against `juminhyo_en.pdf`, confirm 3 annotations printed with ⚠ warnings
- `test-overlay.mjs` — run against `juminhyo_en.pdf` + `juminhyo.pdf`, confirm output PDF written

**Engine integration test (manual Node script)**

Add a script `scripts/test-render.mjs` that exercises the full consumer path end-to-end:

```
node scripts/test-render.mjs
```

This script:

1. Calls `renderOverlayPdfToFile` with the `juminhyo` schema and a full sample values object
2. Writes output to `scripts/test-render-output.pdf`
3. Logs success + output path
4. Does NOT draw debug boxes — the output should look like a real filled form

This is the single most important test: it proves the package works as a consumer would use it, using real coordinates and real font rendering, producing a clean PDF.

Sample values to use (same as `SAMPLE_DATA` in `test-overlay.mjs`):

```js
{
  name: "田中 太郎", furigana: "タナカ タロウ",
  address: "東京都港区六本木1-1-1", phone: "090-1234-5678",
  dob_year: "1990", dob_month: "05", dob_day: "15",
  application_year: "2026", application_month: "04", application_day: "06",
  name_2: "田中 太郎", dob_year_2: "1990", dob_month_2: "05", dob_day_2: "15",
  address_2: "東京都港区六本木1-1-1", phone_2: "090-1234-5678",
}
```

Font and asset root paths should be configurable via env vars `FONT_PATH` and `ASSET_ROOT`, with sensible local fallbacks.

### Future: automated tests

Once the contributor base grows, add a test runner (e.g. Node `--test`) with:

- Unit tests for `renderOverlayPdf` using a minimal PDF fixture
- Snapshot test: render juminhyo with known values, compare output byte-for-byte against a committed reference PDF
- Type tests: confirm `OverlayFormSchema` and `OverlayField` types are correctly exported

These are out of scope for this milestone but should be noted in a future issue.

---

## File Summary

| File                              | Action                                                                               |
| --------------------------------- | ------------------------------------------------------------------------------------ |
| `FIELD_NAMES.md`                  | Create                                                                               |
| `scripts/extract-annotations.mjs` | Create                                                                               |
| `scripts/test-overlay.mjs`        | Full rewrite                                                                         |
| `scripts/extract-annotations.mjs` | Create                                                                               |
| `scripts/generate-schema.mjs`     | Create                                                                               |
| `scripts/test-overlay.mjs`        | Full rewrite                                                                         |
| `scripts/test-render.mjs`         | Create                                                                               |
| `CONTRIBUTING.md`                 | Insert "Annotation workflow" section + update script refs + debug-vs-production note |
| `scripts/extract-coords.mjs`      | Delete                                                                               |

Files unchanged: `scripts/inspect-pdf.mjs`, `scripts/test-overlay-en.mjs`

---

## Verification Checklist

After implementation, confirm:

1. `node scripts/extract-annotations.mjs public/forms/juminhyo_en.pdf` — prints 3 annotations; "Name", "Address", "Phone" each show `⚠ UNKNOWN KEY` (capitalised labels, not canonical keys — expected)
2. `node scripts/extract-annotations.mjs --json public/forms/juminhyo_en.pdf` — outputs valid JSON array, no warnings in stdout
3. `node scripts/test-overlay.mjs public/forms/juminhyo_en.pdf public/forms/juminhyo.pdf` — writes output PDF with red debug boxes and sample text; open and verify alignment
4. `node scripts/test-render.mjs` — writes `scripts/test-render-output.pdf`; open and confirm it looks like a real filled form with no debug marks
5. Run `test-overlay.mjs` with a missing font path — confirm error message names `FONT_PATH` env var
6. Run `extract-annotations.mjs` with no args — confirm usage message and exit 1
7. `node scripts/generate-schema.mjs public/forms/juminhyo_en.pdf --id juminhyo --jurisdiction minato-ku --pdf juminhyo.pdf` — prints valid TypeScript to stdout with 3 fields and `// TODO` placeholders
8. Re-run with `--out` to a new path — confirm file is written; re-run again and confirm exit 1 (no overwrite)
9. `npm run typecheck` — still passes (scripts are not TypeScript)
