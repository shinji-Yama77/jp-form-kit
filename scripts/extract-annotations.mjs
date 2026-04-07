import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";
import canonicalKeys from "./config/canonical-keys.json" with { type: "json" };

const CANONICAL_KEYS = new Set(canonicalKeys);

function usage() {
  console.error(
    "Usage: node scripts/extract-annotations.mjs <annotated-pdf-path-or-filename> [--json]",
  );
}

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const pdfPath = args.find((arg) => arg !== "--json");

if (!pdfPath) {
  usage();
  process.exit(1);
}

const freeTextAnnotations = (await readFreeTextAnnotations(pdfPath)).map(
  (annotation) => ({
    label: annotation.label,
    x: annotation.x,
    y: annotation.y,
    rect: annotation.rect,
  }),
);

if (jsonMode) {
  console.log(JSON.stringify(freeTextAnnotations, null, 2));
  process.exit(0);
}

for (const annotation of freeTextAnnotations) {
  const unknownKeySuffix =
    annotation.label && !CANONICAL_KEYS.has(annotation.label)
      ? "  ⚠ UNKNOWN KEY"
      : "";

  console.log(
    `${annotation.label} / x=${annotation.x} / y=${annotation.y} / rect=[${annotation.rect.join(", ")}]${unknownKeySuffix}`,
  );
}
