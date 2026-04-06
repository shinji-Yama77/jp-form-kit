import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync } from "fs";

// Sample data to overlay
const sample = {
  application_year: "2026",
  application_month: "04",
  application_day: "06",
  furigana: "タナカ タロウ",
  name: "田中 太郎",
  address: "東京都港区六本木1-1-1",
  dob_year: "1990",
  dob_month: "05",
  dob_day: "15",
  phone: "090-1234-5678",
  name_2: "田中 太郎",
  dob_year_2: "1990",
  dob_month_2: "05",
  dob_day_2: "15",
  address_2: "東京都港区六本木1-1-1",
  phone_2: "090-1234-5678",
};

// Annotations extracted from juminhyo_en.pdf via textContent
const annotations = [
  { rect: [83,  708, 374, 724], label: "Name",    value: sample.name },
  { rect: [91,  672, 571, 688], label: "Address", value: sample.address },
  { rect: [419, 639, 573, 655], label: "Phone",   value: sample.phone },
];

const pdfBytes = readFileSync("public/forms/juminhyo.pdf");
const doc = await PDFDocument.load(pdfBytes);
doc.registerFontkit(fontkit);

const fontBytes = readFileSync("public/fonts/NotoSansJP-Regular.ttf");
const font = await doc.embedFont(fontBytes);
const page = doc.getPages()[0];

// Draw sample text using annotation rects from juminhyo_en.pdf
for (const ann of annotations) {
  const [x1, y1, x2, y2] = ann.rect;
  const boxH = y2 - y1;

  // Light blue bounding box so we can see alignment
  page.drawRectangle({
    x: x1, y: y1,
    width: x2 - x1, height: boxH,
    borderColor: rgb(0, 0.4, 0.9),
    borderWidth: 0.5,
  });

  // Sample value centred vertically in the box
  page.drawText(ann.value, {
    x: x1 + 3,
    y: y1 + (boxH - 9) / 2,
    size: 9, font,
    color: rgb(0, 0, 0),
  });

  // Small field label above the box
  page.drawText(ann.label, {
    x: x1, y: y2 + 2,
    size: 5, font,
    color: rgb(0, 0.4, 0.9),
  });
}

const out = await doc.save();
writeFileSync("scripts/test-overlay-en-output.pdf", out);
console.log("Written to scripts/test-overlay-en-output.pdf");
