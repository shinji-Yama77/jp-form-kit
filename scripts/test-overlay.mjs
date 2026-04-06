import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { readFreeTextAnnotations } from "./lib/read-annotations.mjs";

const DEFAULT_OUTPUT_PATH = "scripts/test-overlay-output.pdf";
const FONT_PATH = process.env.FONT_PATH;
const DEFAULT_FONT_SIZE = 9;

const SAMPLE_DATA = {
  Name: "田中 太郎",
  furigana: "タナカ タロウ",
  Address: "東京都港区六本木1-1-1",
  Phone: "090-1234-5678",
  dob_year: "1990",
  dob_month: "05",
  dob_day: "15",
  application_year: "2026",
  application_month: "04",
  application_day: "07",
  submit_year: "2026",
  submit_month: "04",
  submit_day: "07",
  move_year: "2026",
  move_month: "04",
  move_day: "01",
  name_2: "田中 花子",
  furigana_2: "タナカ ハナコ",
  address_2: "東京都港区六本木1-1-1",
  phone_2: "03-1234-5678",
  dob_year_2: "1992",
  dob_month_2: "07",
  dob_day_2: "21",
};

function usage() {
  console.error(
    "Usage: node scripts/test-overlay.mjs <annotated-pdf> <blank-pdf> [output-path]\n" +
      "Set FONT_PATH to a Japanese-capable .ttf font file, for example:\n" +
      "FONT_PATH=./fonts/NotoSansJP-Regular.ttf"
  );
}

const [annotatedPdfPath, blankPdfPath, outputPath = DEFAULT_OUTPUT_PATH] = process.argv.slice(2);

if (!annotatedPdfPath || !blankPdfPath) {
  usage();
  process.exit(1);
}

if (!FONT_PATH) {
  console.error(
    "Missing FONT_PATH environment variable.\n" +
      "Set FONT_PATH to a Japanese-capable .ttf font file before running this script."
  );
  process.exit(1);
}

if (!existsSync(FONT_PATH)) {
  console.error(
    `FONT_PATH does not exist: "${FONT_PATH}"\n` +
      "Set FONT_PATH to a valid Japanese-capable .ttf font file."
  );
  process.exit(1);
}

const freeTextAnnotations = await readFreeTextAnnotations(annotatedPdfPath);

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

  const value = SAMPLE_DATA[annotation.label] ?? "";
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
