import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";

const DEFAULT_OUTPUT_PATH = "scripts/test-overlay-output.pdf";
const FONT_PATH = process.env.FONT_PATH;
const DEFAULT_FONT_SIZE = 9;

function usage() {
  console.error(
    "Usage: node scripts/test-overlay.mjs <annotated-pdf> <blank-pdf> [output-path] [--values values.json]\n" +
      "Set FONT_PATH to a Japanese-capable .ttf font file, for example:\n" +
      "FONT_PATH=./fonts/NotoSansJP-Regular.ttf",
  );
}

function parseArgs(argv) {
  const positional = [];
  let valuesPath;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--values") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        console.error("Missing path after --values");
        process.exit(1);
      }
      valuesPath = value;
      index += 1;
      continue;
    }

    positional.push(arg);
  }

  const [annotatedPdfPath, blankPdfPath, outputPath = DEFAULT_OUTPUT_PATH] =
    positional;

  return { annotatedPdfPath, blankPdfPath, outputPath, valuesPath };
}

function buildSampleValue(label) {
  if (!label) return "";

  if (label === "name" || label === "Name") return "田中 太郎";
  if (label === "name_2") return "田中 花子";
  if (label === "furigana") return "タナカ タロウ";
  if (label === "furigana_2") return "タナカ ハナコ";
  if (label === "address" || label === "Address" || label === "address_2") {
    return "東京都港区六本木1-1-1";
  }
  if (label === "phone" || label === "Phone") return "090-1234-5678";
  if (label === "phone_2") return "03-1234-5678";
  if (label.endsWith("_year_2")) return "1992";
  if (label.endsWith("_month_2")) return "07";
  if (label.endsWith("_day_2")) return "21";
  if (label.endsWith("_year")) return "2026";
  if (label.endsWith("_month")) return "04";
  if (label.endsWith("_day")) return "07";

  return `[${label}]`;
}

function loadValueOverrides(valuesPath) {
  if (!valuesPath) return {};

  if (!existsSync(valuesPath)) {
    console.error(`Values file does not exist: "${valuesPath}"`);
    process.exit(1);
  }

  const raw = readFileSync(valuesPath, "utf8");

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      console.error(
        "Values file must contain a JSON object mapping field keys to sample strings.",
      );
      process.exit(1);
    }

    return parsed;
  } catch (error) {
    console.error(
      `Could not parse values JSON: "${valuesPath}"\n${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

const { annotatedPdfPath, blankPdfPath, outputPath, valuesPath } = parseArgs(
  process.argv.slice(2),
);

if (!annotatedPdfPath || !blankPdfPath) {
  usage();
  process.exit(1);
}

if (!FONT_PATH) {
  console.error(
    "Missing FONT_PATH environment variable.\n" +
      "Set FONT_PATH to a Japanese-capable .ttf font file before running this script.",
  );
  process.exit(1);
}

if (!existsSync(FONT_PATH)) {
  console.error(
    `FONT_PATH does not exist: "${FONT_PATH}"\n` +
      "Set FONT_PATH to a valid Japanese-capable .ttf font file.",
  );
  process.exit(1);
}

const freeTextAnnotations = await readFreeTextAnnotations(annotatedPdfPath);
const valueOverrides = loadValueOverrides(valuesPath);

const blankPdf = await PDFDocument.load(readFileSync(blankPdfPath));
blankPdf.registerFontkit(fontkit);
const font = await blankPdf.embedFont(readFileSync(FONT_PATH));
const page = blankPdf.getPages()[0];

for (const annotation of freeTextAnnotations) {
  page.drawRectangle({
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
    borderColor: rgb(1, 0, 0),
    borderWidth: 0.5,
  });

  page.drawText(annotation.label, {
    x: annotation.x,
    y: annotation.y + annotation.height + 2,
    size: 5,
    font,
    color: rgb(1, 0, 0),
  });

  const value =
    typeof valueOverrides[annotation.label] === "string"
      ? valueOverrides[annotation.label]
      : buildSampleValue(annotation.label);
  if (!value) continue;

  page.drawText(value, {
    x: annotation.x + 2,
    y: annotation.y + Math.max((annotation.height - DEFAULT_FONT_SIZE) / 2, 1),
    size: DEFAULT_FONT_SIZE,
    font,
    color: rgb(0, 0, 1),
  });
}

writeFileSync(outputPath, await blankPdf.save());
console.log(`Wrote debug overlay PDF to ${outputPath}`);
