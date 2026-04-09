import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, relative } from "path";
import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";
import canonicalFieldMeta from "./config/canonical-field-meta.json" with { type: "json" };

function usage() {
  console.error(
    "Usage: node scripts/generate-schema.mjs <annotated-pdf> --id <form-id> --jurisdiction <slug> --pdf <pdf-filename> [--out <path>] [--meta <metadata.json>]",
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
  const metaPath = flagValues.get("--meta");

  if (!id || !jurisdiction || !pdfFilename) {
    usage();
    process.exit(1);
  }

  return {
    annotatedPdfPath,
    id,
    jurisdiction,
    pdfFilename,
    outPath,
    metaPath,
  };
}

function buildFieldObject(annotation) {
  const field = {
    key: annotation.label,
    x: annotation.x,
    y: annotation.y,
  };

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

  parts.push(`x: ${field.x}`);
  parts.push(`y: ${field.y}`);

  if (field.labelEn) parts.push(`labelEn: "${field.labelEn}"`);
  if (field.labelJa) parts.push(`labelJa: "${field.labelJa}"`);

  return `    { ${parts.join(", ")} },`;
}

function serializeFieldLineWithIndent(field, indent = "    ") {
  return `${indent}${toFieldLine(field).trimStart()}`;
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

function loadMetadata(metaPath) {
  if (!metaPath) return {};

  if (!existsSync(metaPath)) {
    console.error(`Metadata file does not exist: ${metaPath}`);
    process.exit(1);
  }

  try {
    const parsed = JSON.parse(readFileSync(metaPath, "utf8"));

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error("Metadata file must contain a JSON object.");
      process.exit(1);
    }

    return parsed;
  } catch (error) {
    console.error(
      `Could not parse metadata JSON: "${metaPath}"\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

function serializeVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return "";

  const entries = variants.map((variant) => {
    const lines = [
      `      lang: ${JSON.stringify(variant.lang)},`,
      `      pdfFilename: ${JSON.stringify(variant.pdfFilename)},`,
      `      sourceUrl: ${JSON.stringify(variant.sourceUrl)},`,
    ];

    if (Array.isArray(variant.fields) && variant.fields.length > 0) {
      lines.push("      fields: [");
      for (const field of variant.fields) {
        lines.push(serializeFieldLineWithIndent(field, "        "));
      }
      lines.push("      ],");
    }

    return `    {\n${lines.join("\n")}\n    }`;
  });

  return `  variants: [\n${entries.join(",\n")}\n  ],\n`;
}

function buildSchemaSource({
  id,
  jurisdiction,
  pdfFilename,
  outPath,
  fields,
  metadata,
}) {
  const importPath = getImportPath(outPath);
  const schemaExportName = `${id.replace(/-([a-z])/g, (_, char) => char.toUpperCase())}Schema`;
  const variantsBlock = serializeVariants(metadata.variants);

  return `import type { OverlayFormSchema } from "${importPath}";

export const ${schemaExportName}: OverlayFormSchema = {
  id: "${id}",
  titleJa: ${JSON.stringify(metadata.titleJa ?? "")},
  titleEn: ${JSON.stringify(metadata.titleEn ?? "")},
  pdfFilename: "${pdfFilename}",
  sourceUrl: ${JSON.stringify(metadata.sourceUrl ?? "")},
  category: ${JSON.stringify(metadata.category ?? "ward")},
  jurisdiction: "${jurisdiction}",
  lastVerifiedAt: ${JSON.stringify(metadata.lastVerifiedAt ?? "")},
${variantsBlock}  fields: [
${fields.map(toFieldLine).join("\n")}
  ],
};

// TODO: Fill in any remaining metadata placeholders before submitting.
// TODO: Verify every generated field against the blank PDF before submitting.
`;
}

const { annotatedPdfPath, id, jurisdiction, pdfFilename, outPath, metaPath } =
  parseArgs(process.argv);

if (outPath && existsSync(outPath)) {
  console.error(`Refusing to overwrite existing file: ${outPath}`);
  process.exit(1);
}

const annotations = await readFreeTextAnnotations(annotatedPdfPath);
const fields = annotations.map(buildFieldObject);
const metadata = loadMetadata(metaPath);
const source = buildSchemaSource({
  id,
  jurisdiction,
  pdfFilename,
  outPath,
  fields,
  metadata,
});

if (outPath) {
  writeFileSync(outPath, source);
  console.log(`Wrote schema skeleton to ${outPath}`);
} else {
  process.stdout.write(source);
}
