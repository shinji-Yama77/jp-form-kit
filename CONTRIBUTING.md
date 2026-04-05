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

## Adding a form to an existing jurisdiction

If you're adding a form for a jurisdiction that already has a folder (e.g. `src/forms/minato/`), follow these steps.

### Step 1 — Get the official PDF

Download the form from the official government website. Record the exact URL — this becomes `sourceUrl` in your schema. Do **not** commit the PDF to the repo.

### Step 2 — Check if the PDF has form fields

```bash
node scripts/inspect-pdf.mjs path/to/form.pdf
```

- **Has AcroForm fields** — you can read field names and positions directly
- **Flat PDF** (most Japanese government PDFs) — proceed to step 3

### Step 3 — Map the field coordinates

**Option A — macOS Preview (recommended)**

1. Open the PDF in macOS Preview
2. For each field you want to map: **Tools → Annotate → Text**, place a text box on the field, type the field key name inside (e.g. `name`, `dob_year`, `address`)
3. Save the annotated PDF
4. Run:

```bash
node scripts/extract-coords.mjs path/to/annotated.pdf
```

This prints annotation rects as `[x1, y1, x2, y2]`. Use `x = x1`, `y = y1` as your field coordinates.

**Option B — Browser coord picker**

Open `scripts/coord-picker.html` in a browser, load the clean PDF, click each field to record x/y coordinates, export as JSON.

### Step 4 — Create the schema file

Create `src/forms/{jurisdiction}/{form-id}.ts`. Copy this template:

```typescript
import type { OverlayFormSchema } from "../../types.js";

export const myFormSchema: OverlayFormSchema = {
  id: "my-form-id",           // kebab-case, unique across all schemas
  titleJa: "申請書",
  titleEn: "English title",
  pdfFilename: "my-form.pdf", // filename only — consumer app controls the path
  downloadName: "my-form.pdf",
  sourceUrl: "https://...",   // real URL where you downloaded the PDF
  category: "ward",           // see FormCategory in src/types.ts
  jurisdiction: "minato-ku",  // see jurisdiction slugs below
  lastVerifiedAt: "2026-04-05",
  verificationLocation: "港区役所 official website — city.minato.tokyo.jp",
  warningThresholdDays: 180,
  description: "One-line English description",
  fields: [
    { key: "name",     x: 111, y: 697, labelEn: "Full Name", labelJa: "氏名", required: true },
    { key: "dob_year", vaultKey: "dob", x: 192, y: 631, labelEn: "Date of Birth", labelJa: "生年月日" },
    // ...
  ],
};
```

**Field key rules:**
- `key` must be unique within this form
- If a field maps to a sub-part of a data value (e.g. splitting a date into year/month/day), set `vaultKey` to the parent key (e.g. `"dob"`) so consuming apps know the source field
- Never use a key that already exists in a published schema — renaming is a breaking change

### Step 5 — Verify alignment

```bash
node scripts/test-overlay.mjs path/to/source.pdf path/to/output.pdf
```

Open the output PDF. Every field should have a red bounding box sitting on the correct form field. If anything is misaligned, go back and adjust the coordinates.

**This output PDF is required for your PR.** Attach it to the PR description as proof of correct alignment.

### Step 6 — Wire up exports

Add your schema to the jurisdiction's `index.ts`:

```typescript
// src/forms/minato/index.ts
export { juminhyoSchema } from "./juminhyo.js";
export { teninSchema }    from "./tenin.js";
export { myFormSchema }   from "./my-form.js";  // ← add this
```

Then add it to `src/forms/index.ts`:

```typescript
import { juminhyoSchema, teninSchema, myFormSchema } from "./minato/index.js";

export * from "./minato/index.js";

export const allForms = [
  juminhyoSchema,
  teninSchema,
  myFormSchema,  // ← add this
];
```

### Step 7 — Typecheck

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
import { juminhyoSchema, teninSchema }  from "./minato/index.js";
import { myFormSchema }                 from "./shinjuku-ku/index.js";  // ← add

export * from "./minato/index.js";
export * from "./shinjuku-ku/index.js";  // ← add

export const allForms = [
  juminhyoSchema,
  teninSchema,
  myFormSchema,  // ← add
];
```

### 4 — Jurisdiction slug conventions

| Jurisdiction | Slug |
| --- | --- |
| 港区 Minato ward | `minato-ku` |
| 新宿区 Shinjuku ward | `shinjuku-ku` |
| 渋谷区 Shibuya ward | `shibuya-ku` |
| National forms (pension, tax) | `national` |
| Immigration Bureau | `immigration-bureau` |
| Banks | `smbc`, `mizuho`, `mufg` etc. |

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

- [ ] Schema `.ts` file created in the correct jurisdiction folder
- [ ] Exported from the jurisdiction `index.ts`
- [ ] Added to `allForms` in `src/forms/index.ts`
- [ ] `sourceUrl` is a real, working government URL
- [ ] `lastVerifiedAt` is set to the date you verified the form
- [ ] `npm run typecheck` passes
- [ ] Test-overlay output PDF attached to the PR description showing correct field alignment

PRs without the overlay PDF will not be merged — coordinates cannot be reviewed from code alone.

---

## Bilingual forms (Japanese and English versions)

Some Japanese government forms are available in both Japanese and English — the same physical form, same fields, same coordinates, just different language labels printed on the PDF.

When a form has multiple language versions, use the `variants` field instead of creating separate schemas. Field coordinates are shared across all variants because the form layout is identical.

```typescript
export const juminhyoSchema: OverlayFormSchema = {
  id: "juminhyo",
  pdfFilename: "juminhyo.pdf",      // default — Japanese version
  downloadName: "juminhyo.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/",
  // ...
  variants: [
    {
      lang: "en",
      pdfFilename: "juminhyo-en.pdf",
      downloadName: "juminhyo-en.pdf",
      sourceUrl: "https://www.city.minato.tokyo.jp/",  // URL for the English PDF specifically
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
