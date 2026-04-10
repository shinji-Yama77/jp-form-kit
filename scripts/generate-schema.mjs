import { existsSync, readFileSync, writeFileSync } from "fs";
import { dirname, relative } from "path";
import ts from "typescript";
import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";
import canonicalFieldMeta from "./config/canonical-field-meta.json" with { type: "json" };

function usage() {
  console.error(`Usage:
  New schema:
    node scripts/generate-schema.mjs <annotated-pdf> --id <form-id> --jurisdiction <slug> --pdf <pdf-filename> [--out <path>] [--meta <metadata.json>]

  Add or update a variant on an existing schema:
    node scripts/generate-schema.mjs <annotated-pdf> --variant-for <schema.ts> --variant-lang <lang> --pdf <pdf-filename> [--out <path>] [--meta <variant-metadata.json>]`);
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

  const variantFor = flagValues.get("--variant-for");

  if (variantFor) {
    const variantLang = flagValues.get("--variant-lang");
    const pdfFilename = flagValues.get("--pdf");
    if (!variantLang || !pdfFilename) {
      usage();
      process.exit(1);
    }

    return {
      mode: "variant",
      annotatedPdfPath,
      variantFor,
      variantLang,
      pdfFilename,
      outPath: flagValues.get("--out"),
      metaPath: flagValues.get("--meta"),
    };
  }

  const id = flagValues.get("--id");
  const jurisdiction = flagValues.get("--jurisdiction");
  const pdfFilename = flagValues.get("--pdf");

  if (!id || !jurisdiction || !pdfFilename) {
    usage();
    process.exit(1);
  }

  return {
    mode: "new",
    annotatedPdfPath,
    id,
    jurisdiction,
    pdfFilename,
    outPath: flagValues.get("--out"),
    metaPath: flagValues.get("--meta"),
  };
}

function buildFieldObject(annotation) {
  const field = {
    key: annotation.label,
    x: annotation.x,
    y: annotation.y,
  };

  const meta = canonicalFieldMeta[annotation.label];
  if (meta?.labelEn) field.labelEn = meta.labelEn;
  if (meta?.labelJa) field.labelJa = meta.labelJa;

  return field;
}

function toFieldLine(field, indent = "    ") {
  const parts = [`key: "${field.key}"`, `x: ${field.x}`, `y: ${field.y}`];

  if (field.labelEn) parts.push(`labelEn: "${field.labelEn}"`);
  if (field.labelJa) parts.push(`labelJa: "${field.labelJa}"`);
  if (field.required === true) parts.push("required: true");

  return `${indent}{ ${parts.join(", ")} },`;
}

function getImportPath(outPath) {
  if (!outPath) return "../../types.js";

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

function serializeVariantObject(variant, includeFields) {
  const lines = [
    `      lang: ${JSON.stringify(variant.lang)},`,
    `      pdfFilename: ${JSON.stringify(variant.pdfFilename)},`,
    `      sourceUrl: ${JSON.stringify(variant.sourceUrl ?? "")},`,
    `      lastVerifiedAt: ${JSON.stringify(variant.lastVerifiedAt ?? "")},`,
  ];

  if (variant.pdfSha256) {
    lines.push(`      pdfSha256: ${JSON.stringify(variant.pdfSha256)},`);
  }

  if (
    includeFields &&
    Array.isArray(variant.fields) &&
    variant.fields.length > 0
  ) {
    lines.push("      fields: [");
    for (const field of variant.fields) {
      lines.push(toFieldLine(field, "        "));
    }
    lines.push("      ],");
  }

  return `    {\n${lines.join("\n")}\n    }`;
}

function serializeVariants(variants) {
  if (!Array.isArray(variants) || variants.length === 0) return "";

  return `  variants: [\n${variants.join(",\n")}\n  ],\n`;
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
  const variantEntries = Array.isArray(metadata.variants)
    ? metadata.variants.map((variant) => serializeVariantObject(variant, true))
    : [];

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
${metadata.pdfSha256 ? `  pdfSha256: ${JSON.stringify(metadata.pdfSha256)},\n` : ""}${serializeVariants(variantEntries)}  fields: [
${fields.map((field) => toFieldLine(field)).join("\n")}
  ],
};

// TODO: Fill in any remaining metadata placeholders before submitting.
// TODO: Verify every generated field against the blank PDF before submitting.
`;
}

function parseObjectLiteralFieldArray(sourceText, property) {
  const sourceFile = ts.createSourceFile(
    "schema.ts",
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let objectLiteral;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      objectLiteral = node.initializer;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!objectLiteral) {
    console.error("Could not find schema object in target schema file.");
    process.exit(1);
  }

  const propertyNode = objectLiteral.properties.find(
    (node) =>
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === property &&
      ts.isArrayLiteralExpression(node.initializer),
  );

  if (!propertyNode) return undefined;

  return propertyNode.initializer;
}

function readExistingFields(sourceText) {
  const fieldsArray = parseObjectLiteralFieldArray(sourceText, "fields");
  if (!fieldsArray) return [];

  return fieldsArray.elements.map((element) => {
    if (!ts.isObjectLiteralExpression(element)) {
      console.error("Unexpected non-object entry in fields array.");
      process.exit(1);
    }

    const result = {};
    for (const property of element.properties) {
      if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name))
        continue;
      const key = property.name.text;
      const initializer = property.initializer;

      if (ts.isStringLiteral(initializer)) {
        result[key] = initializer.text;
      } else if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
        result[key] = true;
      } else if (ts.isNumericLiteral(initializer)) {
        result[key] = Number(initializer.text);
      }
    }
    return result;
  });
}

function normalizeField(field) {
  return JSON.stringify({
    key: field.key,
    x: field.x,
    y: field.y,
    labelEn: field.labelEn ?? "",
    labelJa: field.labelJa ?? "",
    required: field.required === true,
  });
}

function shouldIncludeVariantFields(baseFields, variantFields) {
  if (baseFields.length !== variantFields.length) return true;

  const baseByKey = new Map(
    baseFields.map((field) => [field.key, normalizeField(field)]),
  );
  for (const field of variantFields) {
    if (baseByKey.get(field.key) !== normalizeField(field)) {
      return true;
    }
  }

  return false;
}

function formatInsertedVariant(variantSource) {
  return variantSource;
}

function upsertVariantSource(schemaSource, variantSource, variantLang) {
  const sourceFile = ts.createSourceFile(
    "schema.ts",
    schemaSource,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  let objectLiteral;

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      objectLiteral = node.initializer;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (!objectLiteral) {
    console.error("Could not find schema object in target schema file.");
    process.exit(1);
  }

  const variantsProperty = objectLiteral.properties.find(
    (node) =>
      ts.isPropertyAssignment(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "variants" &&
      ts.isArrayLiteralExpression(node.initializer),
  );

  if (!variantsProperty) {
    const fieldsProperty = objectLiteral.properties.find(
      (node) =>
        ts.isPropertyAssignment(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "fields",
    );

    if (!fieldsProperty) {
      console.error("Could not find fields property in target schema file.");
      process.exit(1);
    }

    const insertPos = fieldsProperty.getFullStart();
    const inserted = `  variants: [\n${variantSource}\n  ],\n`;
    return (
      schemaSource.slice(0, insertPos) +
      inserted +
      schemaSource.slice(insertPos)
    );
  }

  const existingArray = variantsProperty.initializer;
  const existingElements = existingArray.elements;
  const existingVariantIndex = existingElements.findIndex((element) => {
    if (!ts.isObjectLiteralExpression(element)) return false;
    return element.properties.some(
      (property) =>
        ts.isPropertyAssignment(property) &&
        ts.isIdentifier(property.name) &&
        property.name.text === "lang" &&
        ts.isStringLiteral(property.initializer) &&
        property.initializer.text === variantLang,
    );
  });

  if (existingVariantIndex >= 0) {
    const existingElement = existingElements[existingVariantIndex];
    const prefix = schemaSource.slice(0, existingElement.getFullStart());
    const replacement = prefix.endsWith("\n")
      ? variantSource
      : `\n${variantSource}`;
    return prefix + replacement + schemaSource.slice(existingElement.getEnd());
  }

  const insertion =
    existingElements.length === 0
      ? `\n${variantSource}\n  `
      : `,\n${variantSource}\n  `;
  return (
    schemaSource.slice(0, existingArray.end - 1) +
    insertion +
    schemaSource.slice(existingArray.end - 1)
  );
}

function buildVariantObject({
  variantLang,
  pdfFilename,
  metadata,
  fields,
  baseFields,
}) {
  const includeFields = shouldIncludeVariantFields(baseFields, fields);
  return {
    lang: variantLang,
    pdfFilename,
    sourceUrl: metadata.sourceUrl ?? "",
    lastVerifiedAt: metadata.lastVerifiedAt ?? "",
    pdfSha256: metadata.pdfSha256,
    fields: includeFields ? fields : undefined,
  };
}

function augmentSchemaWithVariant({
  schemaPath,
  outPath,
  variantLang,
  pdfFilename,
  metadata,
  fields,
}) {
  const schemaSource = readFileSync(schemaPath, "utf8");
  const baseFields = readExistingFields(schemaSource);
  const variant = buildVariantObject({
    variantLang,
    pdfFilename,
    metadata,
    fields,
    baseFields,
  });
  const variantSource = formatInsertedVariant(
    serializeVariantObject(variant, Array.isArray(variant.fields)),
  );
  const nextSource = upsertVariantSource(
    schemaSource,
    variantSource,
    variantLang,
  );
  const destination = outPath ?? schemaPath;

  if (destination === schemaPath || outPath) {
    writeFileSync(destination, nextSource);
    console.log(`Wrote schema with ${variantLang} variant to ${destination}`);
    return;
  }

  process.stdout.write(nextSource);
}

const parsed = parseArgs(process.argv);
const annotations = await readFreeTextAnnotations(parsed.annotatedPdfPath);
const fields = annotations.map(buildFieldObject);
const metadata = loadMetadata(parsed.metaPath);

if (parsed.mode === "new") {
  if (parsed.outPath && existsSync(parsed.outPath)) {
    console.error(`Refusing to overwrite existing file: ${parsed.outPath}`);
    process.exit(1);
  }

  const source = buildSchemaSource({
    id: parsed.id,
    jurisdiction: parsed.jurisdiction,
    pdfFilename: parsed.pdfFilename,
    outPath: parsed.outPath,
    fields,
    metadata,
  });

  if (parsed.outPath) {
    writeFileSync(parsed.outPath, source);
    console.log(`Wrote schema skeleton to ${parsed.outPath}`);
  } else {
    process.stdout.write(source);
  }
} else {
  augmentSchemaWithVariant({
    schemaPath: parsed.variantFor,
    outPath: parsed.outPath,
    variantLang: parsed.variantLang,
    pdfFilename: parsed.pdfFilename,
    metadata,
    fields,
  });
}
