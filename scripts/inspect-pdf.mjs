import { PDFDocument } from "pdf-lib";
import { readFileSync } from "fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/inspect-pdf.mjs public/forms/juminhyo.pdf");
  process.exit(1);
}

const bytes = readFileSync(file);
const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
const form = pdf.getForm();
const fields = form.getFields();

if (fields.length === 0) {
  console.log("No AcroForm fields found — this is a flat PDF, need coordinate overlay.");
} else {
  console.log(`Found ${fields.length} AcroForm fields:\n`);
  for (const field of fields) {
    console.log(`  [${field.constructor.name}] "${field.getName()}"`);
  }
}
