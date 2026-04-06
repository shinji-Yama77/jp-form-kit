import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, writeFileSync } from "fs";

// Annotations extracted from the filled Preview PDF
// rect: [x1, y1, x2, y2]
const annotations = [
  { rect: [87, 731, 372, 747], label: "field_1" },
  { rect: [83, 708, 374, 724], label: "field_2" },
  { rect: [91, 672, 571, 688], label: "field_3" },
  { rect: [420, 632, 572, 663], label: "field_4" },
];

const pdfBytes = readFileSync("public/forms/juminhyo.pdf");
const doc = await PDFDocument.load(pdfBytes);
doc.registerFontkit(fontkit);

const fontBytes = readFileSync("public/fonts/NotoSansJP-Regular.ttf");
const font = await doc.embedFont(fontBytes);
const page = doc.getPages()[0];

for (const ann of annotations) {
  const [x1, y1, x2, y2] = ann.rect;

  // Draw red bounding box so we can see where each annotation sits
  page.drawRectangle({
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
    borderColor: rgb(1, 0, 0),
    borderWidth: 0.5,
  });

  // Draw the label inside the box
  page.drawText(ann.label, {
    x: x1 + 2,
    y: y1 + 2,
    size: 9,
    font,
    color: rgb(0, 0, 1),
  });
}

const outBytes = await doc.save();
writeFileSync("scripts/test-overlay-output.pdf", outBytes);
console.log("Written to scripts/test-overlay-output.pdf — open it to see where the boxes land");
