import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { OverlayFormSchema } from "../types.js";

const BUNDLED_FONT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/NotoSansJP-Regular.ttf",
);
import { allForms } from "../forms/index.js";
import { resolvePdfBytes } from "./resolve-pdf.js";
import { MissingFontError, MissingPdfError, UnknownSchemaError } from "./errors.js";

const DEFAULT_FONT_SIZE = 9;

export interface RenderOptions {
  /**
   * Exact path to the blank source PDF.
   * If provided, takes precedence over assetRoot — the engine loads this file directly.
   */
  pdfPath?: string;
  /**
   * Directory where blank source PDFs live.
   * The engine resolves the path as {assetRoot}/{jurisdiction}/{id}/{pdfFilename}.
   * Ignored if pdfPath is provided.
   */
  assetRoot?: string;
  /**
   * Path to a Japanese-capable .ttf font file (e.g. NotoSansJP-Regular.ttf).
   * If omitted, the bundled NotoSansJP-Regular font is used.
   */
  fontPath?: string;
}

/**
 * Renders a filled PDF by overlaying values onto a blank source PDF.
 *
 * @param schema  - OverlayFormSchema object, or a schema id string (e.g. "juminhyo")
 * @param values  - Record mapping each field key to the text value to draw
 * @param options - Asset root directory and font path
 * @returns       - Generated PDF as a Uint8Array — write to disk or return to caller
 *
 * @example
 * const pdfBytes = await renderOverlayPdf("juminhyo", {
 *   name: "SMITH JOHN",
 *   address: "東京都港区六本木3-1-1",
 *   dob_year: "1990", dob_month: "03", dob_day: "15",
 * }, { pdfPath: "./forms/juminhyo.pdf" });
 *
 * writeFileSync("output.pdf", pdfBytes);
 */
export async function renderOverlayPdf(
  schema: OverlayFormSchema | string,
  values: Record<string, string>,
  options: RenderOptions,
): Promise<Uint8Array> {
  // Resolve schema id → schema object
  const resolvedSchema: OverlayFormSchema =
    typeof schema === "string"
      ? (() => {
          const found = allForms.find((f) => f.id === schema);
          if (!found) throw new UnknownSchemaError(schema);
          return found;
        })()
      : schema;

  // Resolve and load blank source PDF
  let pdfBytes: Uint8Array;
  if (options.pdfPath) {
    if (!existsSync(options.pdfPath)) {
      throw new MissingPdfError(resolvedSchema.pdfFilename, options.pdfPath);
    }
    pdfBytes = new Uint8Array(readFileSync(options.pdfPath));
  } else if (options.assetRoot) {
    pdfBytes = resolvePdfBytes(resolvedSchema, options.assetRoot);
  } else {
    throw new MissingPdfError(resolvedSchema.pdfFilename, "(no pdfPath or assetRoot provided)");
  }
  const pdf = await PDFDocument.load(pdfBytes);

  // Load Japanese font — use bundled NotoSansJP if no fontPath provided
  const fontFullPath = options.fontPath ?? BUNDLED_FONT_PATH;
  if (!existsSync(fontFullPath)) {
    throw new MissingFontError(fontFullPath);
  }
  pdf.registerFontkit(fontkit);
  const fontBytes = new Uint8Array(readFileSync(fontFullPath));
  const font = await pdf.embedFont(fontBytes);

  // Draw field values onto first page
  const page = pdf.getPages()[0];
  for (const field of resolvedSchema.fields) {
    const value = values[field.key] ?? "";
    if (!value) continue;
    page.drawText(value, {
      x: field.x,
      y: field.y,
      size: field.size ?? DEFAULT_FONT_SIZE,
      font,
    });
  }

  return new Uint8Array(await pdf.save());
}

/**
 * Convenience wrapper — renders and writes the output PDF to disk.
 *
 * @param outputPath - Where to write the generated PDF (e.g. "./output/juminhyo-filled.pdf")
 */
export async function renderOverlayPdfToFile(
  schema: OverlayFormSchema | string,
  values: Record<string, string>,
  options: RenderOptions,
  outputPath: string,
): Promise<void> {
  const bytes = await renderOverlayPdf(schema, values, options);
  writeFileSync(outputPath, bytes);
}
