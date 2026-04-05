# jp-form-schemas — Project Plan

## What this is

An open-source TypeScript npm package: a community-maintained registry of Japanese government form schemas with a PDF coordinate overlay toolkit. Anyone can contribute a schema for a new form by following the authoring workflow, and the package stays useful across apps.

Extracted from [SmartLayer/unidentity](https://github.com/shinchan/unidentity) where the schemas were app-specific. The goal is to decouple the schemas from any single app so they can be maintained by contributors who know the forms.

---

## Goals for v1

- Publish to npm as `jp-form-schemas`
- Ship 5–6 verified Minato ward forms as the seed dataset
- Establish a contributor workflow that produces consistent, verifiable schemas
- Zero runtime dependencies in the published package (types + plain objects only)
- Schema data is independent of any vault, auth, or app logic

---

## Repo structure

```
jp-form-schemas/
  src/
    types.ts                  core TypeScript types
    forms/
      minato/
        juminhyo.ts           住民票等請求書 ✓
        tenin.ts              転入届 ✓
        kokumin-nenkin.ts     国民年金加入申請 (todo)
        kenko-hoken.ts        健康保険加入申請 (todo)
        zairyu-koushin.ts     在留カード更新申請 (todo)
        mynumber.ts           マイナンバーカード申請 (todo)
        index.ts              re-exports all minato forms
      index.ts                re-exports all forms + allForms array
    index.ts                  public package entry point
  scripts/
    extract-coords.mjs        reads Preview annotations → prints x/y midpoints
    coord-picker.html         browser canvas tool — click to record coordinates
    inspect-pdf.mjs           checks whether PDF has AcroForm fields or is flat
    test-overlay.mjs          draws bounding boxes on PDF to verify alignment
  package.json
  tsconfig.json
  tsconfig.build.json
  .gitignore
  .npmignore
  README.md
  CONTRIBUTING.md
  AGENTS.md
  PLAN.md                     (this file)
  LICENSE
```

---

## Types (src/types.ts)

These are the canonical types for the package. No dependencies — pure TypeScript.

```typescript
export type FormCategory =
  | "ward"
  | "immigration"
  | "pension"
  | "employment"
  | "banking"
  | "housing";

export interface OverlayField {
  key: string;           // unique key within this form (used as lookup in value map)
  x: number;            // x coordinate in PDF points, bottom-left origin
  y: number;            // y coordinate in PDF points
  size?: number;        // font size override (default: 9)
  vaultKey?: string;    // if key is a split subfield (e.g. dob_year), the source data key (e.g. "dob")
  labelEn?: string;     // English label — shown in review UIs
  labelJa?: string;     // Japanese label — shown in review UIs
  required?: boolean;
}

export interface OverlayFormSchema {
  id: string;                   // kebab-case, unique across all schemas
  titleJa: string;              // official Japanese form title
  titleEn: string;              // English translation
  pdfFilename: string;          // just the filename (e.g. "juminhyo.pdf") — consumer app controls the path
  downloadName: string;         // suggested filename for the exported PDF
  sourceUrl: string;            // real government URL — must be verifiable
  category: FormCategory;
  jurisdiction: string;         // filterable issuer slug — e.g. "minato-ku", "national", "immigration-bureau", "smbc"
  lastVerifiedAt: string;       // ISO 8601 date (YYYY-MM-DD)
  verificationLocation: string; // human-readable — e.g. "港区役所 official website — city.minato.tokyo.jp"
  warningThresholdDays: number; // days before consuming apps show a staleness warning
  description: string;          // one-line English description
  fields: OverlayField[];
}
// Dropped from original SmartLayer schema:
//   free: boolean — app-specific pricing tier, has no meaning in a general package
//   pdfUrl: string — replaced by pdfFilename; consumer app controls the base path
```

---

## Schema authoring workflow

This is how a contributor goes from "I have a PDF" to a merged PR.

### Prerequisites

```bash
npm install          # installs pdfjs-dist, pdf-lib, fontkit for scripts
```

### Step 1 — Obtain the official PDF

- Download the form from the official ward/institution website
- Record the exact URL — this becomes `sourceUrl` in the schema
- Name the file `{form-id}.pdf` (e.g. `kenko-hoken.pdf`)
- Do NOT commit the PDF to the repo — link to `sourceUrl` instead

### Step 2 — Check if the PDF has AcroForm fields

```bash
node scripts/inspect-pdf.mjs path/to/form.pdf
```

- If it has AcroForm fields: those field names and positions can be used directly
- If it's flat (most Japanese government PDFs are): proceed to step 3

### Step 3 — Annotate field positions in macOS Preview

1. Open the PDF in macOS Preview
2. For each form field you want to map, use **Tools → Annotate → Text** to place a text box directly on top of the field
3. Type the field key name inside the text box (e.g. `name`, `dob_year`, `address`)
4. Save the PDF (keep it separate from the clean source — e.g. `kenko-hoken_annotated.pdf`)

### Step 4 — Extract coordinates

```bash
node scripts/extract-coords.mjs path/to/kenko-hoken_annotated.pdf
```

This prints all annotation rects as `[x1, y1, x2, y2]`.

The overlay x/y for each field is the **bottom-left corner** of the annotation box:
- `x = x1`
- `y = y1`

Or use the midpoint if you prefer centering:
- `x = Math.round((x1 + x2) / 2)`
- `y = Math.round((y1 + y2) / 2)`

The existing schemas use single-point placement (text drawn from a single x/y). Use whichever gives clean alignment when you verify in step 6.

**Alternative: use the coord picker**

Open `scripts/coord-picker.html` in a browser, load the clean PDF, and click each field to record coordinates. Export as JSON. This skips the Preview annotation step.

### Step 5 — Write the TypeScript schema

Create `src/forms/{ward-or-institution}/{form-id}.ts`:

```typescript
import type { OverlayFormSchema } from "../../types";

export const kenkohokenSchema: OverlayFormSchema = {
  id: "kenko-hoken",
  titleJa: "健康保険加入申請書",
  titleEn: "National health insurance enrollment",
  pdfFilename: "kenko-hoken.pdf",
  downloadName: "kenko-hoken.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/...",
  category: "pension",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-04-05",
  verificationLocation: "港区役所 official website — city.minato.tokyo.jp",
  warningThresholdDays: 180,
  description: "Enroll in national health insurance at your local ward office",
  fields: [
    { key: "name",      x: 111, y: 697, labelEn: "Full Name",       labelJa: "氏名",    required: true },
    { key: "furigana",  x: 93,  y: 725, labelEn: "Name (Katakana)", labelJa: "フリガナ" },
    { key: "dob_year",  vaultKey: "dob", x: 192, y: 631, labelEn: "Date of Birth", labelJa: "生年月日", required: true },
    { key: "dob_month", vaultKey: "dob", x: 264, y: 631 },
    { key: "dob_day",   vaultKey: "dob", x: 315, y: 631 },
    { key: "address",   x: 144, y: 664, labelEn: "Address",         labelJa: "住所",    required: true },
  ],
};
```

### Step 6 — Verify with test-overlay

```bash
node scripts/test-overlay.mjs path/to/source.pdf path/to/output.pdf
```

This draws red bounding boxes at each field coordinate so you can see if alignment is correct. Open the output PDF and confirm every box lands on the right field.

**This output PDF is required for your PR** — attach it to prove alignment.

### Step 7 — Wire up exports

Add your schema to `src/forms/minato/index.ts` (or create a new ward folder) and to `src/forms/index.ts`.

### Step 8 — Submit PR

PR must include:
- [ ] The `.ts` schema file
- [ ] Updated `index.ts` exports
- [ ] `sourceUrl` pointing to the real government page
- [ ] `lastVerifiedAt` set to today
- [ ] Test-overlay output PDF attached to the PR description (not committed to repo)
- [ ] Brief note on which ward office and date you verified the form

---

## package.json

```json
{
  "name": "jp-form-schemas",
  "version": "0.1.0",
  "description": "TypeScript schema library and PDF overlay toolkit for Japanese government forms",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "pdfjs-dist": "^4.0.0",
    "pdf-lib": "^1.17.1",
    "@pdf-lib/fontkit": "^1.1.1"
  },
  "keywords": ["japan", "japanese", "forms", "pdf", "schema", "ward", "bureaucracy", "gaijin"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/shinchan/jp-form-schemas"
  }
}
```

Note: `pdfjs-dist`, `pdf-lib`, and `fontkit` are devDependencies only — they're used by contributor scripts, not the published package. The published `dist/` folder is pure TypeScript compiled to JS with no dependencies.

---

## tsconfig.json (for development/typecheck)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"]
}
```

## tsconfig.build.json (for publishing — excludes scripts)

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["scripts", "node_modules"]
}
```

---

## .npmignore

```
scripts/
src/
*.ts
!dist/
tsconfig*.json
PLAN.md
CONTRIBUTING.md
AGENTS.md
```

---

## Versioning policy

- **Patch** (`0.1.x`) — adding new form schemas, updating `lastVerifiedAt`, fixing coordinates
- **Minor** (`0.x.0`) — adding new types/fields to `OverlayField` or `OverlayFormSchema`, new form categories
- **Major** (`x.0.0`) — breaking changes to type definitions that require consumer app updates

Adding a new form schema is always a non-breaking patch. Renaming a field key in an existing schema is a major change (consumer apps that reference that key by name will break).

---

## Staleness policy

Japanese government forms change. Any schema where `lastVerifiedAt` is older than `warningThresholdDays` should show a warning in consuming apps. The package itself doesn't enforce this — it's metadata for apps to act on.

Contributors are encouraged (but not required) to re-verify forms they know have changed and submit update PRs. When updating coordinates for an existing form, bump the patch version.

---

## v1 forms checklist

| Form | Japanese | Status | Category |
|------|----------|--------|----------|
| Resident record request | 住民票等請求書 | ✅ done | ward |
| Move-in notification | 転入届 | ✅ done | ward |
| Health insurance enrollment | 健康保険加入申請 | ⬜ todo | pension |
| National pension enrollment | 国民年金加入申請 | ⬜ todo | pension |
| Residence card renewal | 在留カード更新申請 | ⬜ todo | immigration |
| My Number Card application | マイナンバーカード申請 | ⬜ todo | ward |

Target: all 6 done before first npm publish (`0.1.0`).

---

## GitHub setup

- **Branch protection on `main`**: require PR + 1 approval (can be self-review for now)
- **PR template**: checklist of required items (schema file, exports wired, sourceUrl, lastVerifiedAt, overlay PDF attached)
- **Issue templates**: "New form request" (ward + form name + source URL) and "Schema outdated" (form ID + what changed)
- **Topics**: `japan`, `japanese-forms`, `pdf`, `typescript`, `npm-package`, `minato`, `bureaucracy`

---

## First publish checklist

- [ ] All 6 v1 forms authored and verified
- [ ] `npm run build` produces clean `dist/`
- [ ] `npm pack` to inspect what gets published — confirm only `dist/` + `README.md` + `LICENSE`
- [ ] Create npm account / org if needed
- [ ] `npm publish --access public`
- [ ] Tag release `v0.1.0` in GitHub
- [ ] Update unidentity README to link to this package
