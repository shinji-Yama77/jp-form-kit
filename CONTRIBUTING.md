# Contributing to jp-form-kit

Anyone can contribute a new form schema. A schema is a TypeScript file that describes the fields of a Japanese government PDF form and the x/y coordinates where text should be drawn. No backend, no app logic — just data.

---

## What you need

- Node.js 18+
- macOS (for the Preview annotation workflow) — or use the browser coord picker as an alternative
- The official PDF form from the government website

---

## Setup

```bash
git clone https://github.com/shinchan/jp-form-schemas
cd jp-form-schemas
npm install
```

---

## Annotation workflow

This is the end-to-end process for mapping a new form. Work through all six steps in order.

### Step 1 — Get the official PDF

Download the form from the official government website. Record the exact URL — this becomes `sourceUrl` in your schema. Do **not** commit the PDF to the repo.

### Step 2 — Annotate the PDF

1. Open the PDF in **macOS Preview**
2. For each field you want to map: **Tools → Annotate → Text**, place a text box on the field, and type the canonical field key inside (e.g. `name`, `dob_year`, `address`)
3. Save the annotated PDF (keep it locally — do not commit it)

See [FIELD_NAMES.md](./FIELD_NAMES.md) for the full list of canonical keys and naming conventions.

### Step 3 — Extract and verify annotations

```bash
node scripts/extract-annotations.mjs path/to/annotated.pdf
```

This prints each annotation's label, x/y coordinates, and rect. Any key not in the canonical list is flagged with `⚠ UNKNOWN KEY` — fix the annotation label before continuing.

To get machine-readable output (e.g. for scripting):

```bash
node scripts/extract-annotations.mjs --json path/to/annotated.pdf
```

### Step 4 — Generate the schema skeleton

```bash
node scripts/generate-schema.mjs path/to/annotated.pdf \
  --id my-form-id \
  --jurisdiction minato-ku \
  --pdf my-form.pdf
```

This reads your annotations and outputs a valid TypeScript schema skeleton with coordinates, inferred `vaultKey` values, and `labelEn`/`labelJa` populated for known canonical keys. To write directly to a file:

```bash
node scripts/generate-schema.mjs path/to/annotated.pdf \
  --id my-form-id \
  --jurisdiction minato-ku \
  --pdf my-form.pdf \
  --out src/forms/minato/my-form.ts
```

The script will refuse to overwrite an existing file.

### Step 5 — Fill in the TODOs

Open the generated file and fill in the fields marked `// TODO`:

- `titleJa`, `titleEn` — official Japanese title and English translation
- `sourceUrl` — the URL you downloaded the PDF from (must be a real, working government URL)
- `verificationLocation` — human-readable location, e.g. `"港区役所 official website — city.minato.tokyo.jp"`
- `description` — one-line English description
- `lastVerifiedAt` — today's date in `YYYY-MM-DD` format
- `category` — see `FormCategory` in `src/types.ts`

**Field key rules:**

- `key` must be unique within this form
- For date sub-parts (year/month/day), `vaultKey` is inferred automatically by `generate-schema.mjs` — verify it looks right
- Never rename a `key` in an already-published schema — it is a breaking change

### Step 6 — Verify alignment

```bash
FONT_PATH=/path/to/NotoSansJP-Regular.ttf \
  node scripts/test-overlay.mjs path/to/annotated.pdf path/to/blank.pdf [output-path]
```

This draws red bounding boxes at each field's coordinates on the blank PDF, with sample values filled in blue. Open the output and confirm every box sits on the correct form field.

> The red debug boxes only appear in this script. They do **not** appear in the production output from `renderOverlayPdf`.

**This output PDF is required for your PR.** Attach it to the PR description as proof of correct alignment.

---

## Adding a form to an existing jurisdiction

Once you have completed the annotation workflow above:

### Wire up exports

Add your schema to the jurisdiction's `index.ts`:

```typescript
// src/forms/minato/index.ts
export { juminhyoSchema } from "./juminhyo.js";
export { teninSchema } from "./tenin.js";
export { myFormSchema } from "./my-form.js"; // ← add this
```

Then add it to `src/forms/index.ts`:

```typescript
import { juminhyoSchema, teninSchema, myFormSchema } from "./minato/index.js";

export * from "./minato/index.js";

export const allForms = [
  juminhyoSchema,
  teninSchema,
  myFormSchema, // ← add this
];
```

### Typecheck

```bash
npm run typecheck
```

Fix any errors before submitting.

---

## Adding a new jurisdiction (new ward or institution)

If there is no folder yet for your jurisdiction (e.g. you're adding forms for Shinjuku ward or the national immigration bureau):

### 1 — Create the folder

```
src/forms/shinjuku-ku/     ← new ward
src/forms/national/        ← national-level forms (pension, immigration, tax)
src/forms/immigration-bureau/
src/forms/smbc/            ← bank-specific forms
```

Use the jurisdiction slug as the folder name. See slug conventions below.

### 2 — Create the jurisdiction index

```typescript
// src/forms/shinjuku-ku/index.ts
export { myFormSchema } from "./my-form.js";
```

### 3 — Wire into src/forms/index.ts

```typescript
import { juminhyoSchema, teninSchema } from "./minato/index.js";
import { myFormSchema } from "./shinjuku-ku/index.js"; // ← add

export * from "./minato/index.js";
export * from "./shinjuku-ku/index.js"; // ← add

export const allForms = [
  juminhyoSchema,
  teninSchema,
  myFormSchema, // ← add
];
```

### 4 — Jurisdiction slug conventions

| Jurisdiction                  | Slug                          |
| ----------------------------- | ----------------------------- |
| 港区 Minato ward              | `minato-ku`                   |
| 新宿区 Shinjuku ward          | `shinjuku-ku`                 |
| 渋谷区 Shibuya ward           | `shibuya-ku`                  |
| National forms (pension, tax) | `national`                    |
| Immigration Bureau            | `immigration-bureau`          |
| Banks                         | `smbc`, `mizuho`, `mufg` etc. |

Use kebab-case. For wards, use `{ward-name}-ku`. For national institutions, use a descriptive slug.

---

## Adding a new form category

Categories are defined in `src/types.ts`:

```typescript
export type FormCategory =
  | "ward"
  | "immigration"
  | "pension"
  | "employment"
  | "banking"
  | "housing";
```

Before adding a new value, check if an existing category covers your form. Adding a new category is a **minor version bump** — it requires a `types.ts` change and a `package.json` version update.

If you believe a new category is needed, open an issue first to discuss it before submitting a PR with the types change. This ensures we don't accumulate redundant categories.

When adding a new category in a PR:

- Update `FormCategory` in `src/types.ts`
- Note the minor version bump in your PR description
- The maintainer will update `package.json` version before merging

---

## PR checklist

Every PR adding or updating a schema must include:

- [ ] `extract-annotations.mjs` run with no `⚠ UNKNOWN KEY` warnings
- [ ] Schema `.ts` file created in the correct jurisdiction folder (via `generate-schema.mjs` or manually)
- [ ] All `// TODO` fields filled in
- [ ] Exported from the jurisdiction `index.ts`
- [ ] Added to `allForms` in `src/forms/index.ts`
- [ ] `sourceUrl` is a real, working government URL
- [ ] `lastVerifiedAt` is set to the date you verified the form
- [ ] `npm run typecheck` passes
- [ ] `test-overlay.mjs` output PDF attached to the PR description showing correct field alignment

PRs without the overlay PDF will not be merged — coordinates cannot be reviewed from code alone.

---

## Bilingual forms (Japanese and English versions)

Some Japanese government forms are available in both Japanese and English — the same physical form, same fields, same coordinates, just different language labels printed on the PDF.

When a form has multiple language versions, use the `variants` field instead of creating separate schemas. Field coordinates are shared across all variants because the form layout is identical.

```typescript
export const juminhyoSchema: OverlayFormSchema = {
  id: "juminhyo",
  pdfFilename: "juminhyo.pdf", // default — Japanese version
  downloadName: "juminhyo.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/",
  // ...
  variants: [
    {
      lang: "en",
      pdfFilename: "juminhyo-en.pdf",
      downloadName: "juminhyo-en.pdf",
      sourceUrl: "https://www.city.minato.tokyo.jp/", // URL for the English PDF specifically
    },
  ],
  fields: [
    // same coordinates work for both language versions
  ],
};
```

**Rules for variants:**

- The top-level `pdfFilename` and `sourceUrl` always refer to the Japanese version (the primary)
- Each variant has its own `sourceUrl` — if the English PDF is at a different URL, record it
- Coordinates in `fields` must be verified against both PDFs — if the English layout shifts any fields, do not use variants; create a separate schema instead
- Only add a variant if you have verified the English PDF and confirmed coordinates align

---

## Staleness

Japanese government forms change occasionally. If you know a form has changed:

1. Re-download the PDF from `sourceUrl`
2. Re-run the coordinate workflow
3. Update the schema and set `lastVerifiedAt` to today
4. Submit a PR — this is a patch version bump

If `sourceUrl` is dead or the form has moved, note this in the PR.
