import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";

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

function usage() {
  console.error(
    "Usage: node scripts/extract-annotations.mjs <annotated-pdf-path-or-filename> [--json]"
  );
}

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const pdfPath = args.find((arg) => arg !== "--json");

if (!pdfPath) {
  usage();
  process.exit(1);
}

const freeTextAnnotations = (await readFreeTextAnnotations(pdfPath)).map((annotation) => ({
  label: annotation.label,
  x: annotation.x,
  y: annotation.y,
  rect: annotation.rect,
}));

if (jsonMode) {
  console.log(JSON.stringify(freeTextAnnotations, null, 2));
  process.exit(0);
}

for (const annotation of freeTextAnnotations) {
  const unknownKeySuffix =
    annotation.label && !CANONICAL_KEYS.has(annotation.label) ? "  ⚠ UNKNOWN KEY" : "";

  console.log(
    `${annotation.label} / x=${annotation.x} / y=${annotation.y} / rect=[${annotation.rect.join(", ")}]${unknownKeySuffix}`
  );
}
