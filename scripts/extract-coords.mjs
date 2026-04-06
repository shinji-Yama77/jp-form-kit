import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync } from "fs";

const data = new Uint8Array(readFileSync("public/forms/juminhyo_en.pdf"));
const doc = await getDocument({ data }).promise;
const page = await doc.getPage(1);
const viewport = page.getViewport({ scale: 1 });

console.log(`Page size: ${viewport.width} x ${viewport.height} pts\n`);

const annotations = await page.getAnnotations();
console.log(`Found ${annotations.length} annotations:\n`);

for (const ann of annotations) {
  console.log({
    label: ann.textContent?.join("") ?? ann.contentsObj?.str,
    rect: ann.rect?.map(Math.round),
  });
}
