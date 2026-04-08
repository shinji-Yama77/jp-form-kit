import { existsSync, writeFileSync } from "fs";
import { dirname, relative } from "path";
import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";
import canonicalFieldMeta from "./config/canonical-field-meta.json" with { type: "json" };

function usage() {
  console.error(
    "Usage: node scripts/generate-schema.mjs <annotated-pdf> --id <form-id> --jurisdiction <slug> --pdf <pdf-filename> [--out <path>]",
  );
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const annotatedPdfPath = args[0];

  if (!annotatedPdfPath || annotatedPdfPath.startsWith("--")) {
    usage();
    process.exit(1);
  }

  const flagValues = new Map();

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith("--")) continue;

    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      console.error(`Missing value for ${arg}`);
      process.exit(1);
    }

    flagValues.set(arg, value);
    index += 1;
  }

  const id = flagValues.get("--id");
  const jurisdiction = flagValues.get("--jurisdiction");
  const pdfFilename = flagValues.get("--pdf");
  const outPath = flagValues.get("--out");

  if (!id || !jurisdiction || !pdfFilename) {
    usage();
    process.exit(1);
  }

  return { annotatedPdfPath, id, jurisdiction, pdfFilename, outPath };
}

function inferVaultKey(key) {
  if (/^dob_(year|month|day)(_2)?$/.test(key)) return "dob";
  if (/^move_(year|month|day)$/.test(key)) return "move_date";
  return undefined;
}

function buildFieldObject(annotation) {
  const field = {
    key: annotation.label,
    x: annotation.x,
    y: annotation.y,
  };

  const inferredVaultKey = inferVaultKey(annotation.label);
  if (inferredVaultKey) {
    field.vaultKey = inferredVaultKey;
  }

  const meta = canonicalFieldMeta[annotation.label];
  if (meta?.labelEn) {
    field.labelEn = meta.labelEn;
  }
  if (meta?.labelJa) {
    field.labelJa = meta.labelJa;
  }

  return field;
}

function toFieldLine(field) {
  const parts = [`key: "${field.key}"`];

  if (field.vaultKey) parts.push(`vaultKey: "${field.vaultKey}"`);

  parts.push(`x: ${field.x}`);
  parts.push(`y: ${field.y}`);

  if (field.labelEn) parts.push(`labelEn: "${field.labelEn}"`);
  if (field.labelJa) parts.push(`labelJa: "${field.labelJa}"`);

  return `    { ${parts.join(", ")} },`;
}

function getImportPath(outPath) {
  if (!outPath) {
    return "../../types.js";
  }

  const targetDir = dirname(outPath);
  let importPath = relative(targetDir, "src/types.js");

  if (!importPath.startsWith(".")) {
    importPath = `./${importPath}`;
  }

  return importPath.replaceAll("\\", "/");
}

function buildSchemaSource({ id, jurisdiction, pdfFilename, outPath, fields }) {
  const importPath = getImportPath(outPath);
  const schemaExportName = `${id.replace(/-([a-z])/g, (_, char) => char.toUpperCase())}Schema`;

  return `import type { OverlayFormSchema } from "${importPath}";

export const ${schemaExportName}: OverlayFormSchema = {
  id: "${id}",
  titleJa: "",
  titleEn: "",
  pdfFilename: "${pdfFilename}",
  sourceUrl: "",
  category: "ward",
  jurisdiction: "${jurisdiction}",
  lastVerifiedAt: "",
  verificationLocation: "",
  description: "",
  fields: [
${fields.map(toFieldLine).join("\n")}
  ],
};

// TODO: Fill in titleJa, titleEn, sourceUrl, verificationLocation, and description.
// TODO: Verify every generated field against the blank PDF before submitting.
`;
}

const { annotatedPdfPath, id, jurisdiction, pdfFilename, outPath } = parseArgs(
  process.argv,
);

if (outPath && existsSync(outPath)) {
  console.error(`Refusing to overwrite existing file: ${outPath}`);
  process.exit(1);
}

const annotations = await readFreeTextAnnotations(annotatedPdfPath);
const fields = annotations.map(buildFieldObject);
const source = buildSchemaSource({
  id,
  jurisdiction,
  pdfFilename,
  outPath,
  fields,
});

if (outPath) {
  writeFileSync(outPath, source);
  console.log(`Wrote schema skeleton to ${outPath}`);
} else {
  process.stdout.write(source);
}
