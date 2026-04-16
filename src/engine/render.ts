import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import type { FormVariant, OverlayFormSchema } from "../types.js";
import { allForms } from "../forms/index.js";
import { loadPdfBytes } from "./resolve-pdf.js";
import {
  MissingFontError,
  MissingPdfError,
  UnknownSchemaError,
  UnknownVariantError,
} from "./errors.js";

const BUNDLED_FONT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../assets/NotoSansJP-Regular.ttf",
);

const DEFAULT_FONT_SIZE = 9;
const DEFAULT_X_PADDING = 2;

export interface RenderOptions {
  /**
   * Exact path to the blank source PDF.
   */
  pdfPath: string;
  /**
   * Language variant to render when a schema exposes alternate PDF layouts.
   * If omitted, the base schema PDF and base fields are used.
   */
  variantLang?: FormVariant["lang"];
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
 * @param options - PDF path, variant, and font options
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
  const resolvedVariant =
    options.variantLang === undefined
      ? undefined
      : (() => {
          const found = resolvedSchema.variants?.find(
            (variant) => variant.lang === options.variantLang,
          );
          if (!found) {
            throw new UnknownVariantError(
              resolvedSchema.id,
              options.variantLang,
            );
          }
          return found;
        })();
  const activePdfFilename =
    resolvedVariant?.pdfFilename ?? resolvedSchema.pdfFilename;
  const activeFields = resolvedVariant?.fields ?? resolvedSchema.fields;

  // Resolve and load blank source PDF
  if (!options.pdfPath) {
    throw new MissingPdfError(activePdfFilename, "(no pdfPath provided)");
  }
  const pdfBytes = loadPdfBytes(options.pdfPath, activePdfFilename);
  const pdf = await PDFDocument.load(pdfBytes);

  // Load font — falls back to bundled NotoSansJP if fontPath not provided
  const fontFullPath = options.fontPath ?? BUNDLED_FONT_PATH;
  if (options.fontPath && !existsSync(options.fontPath)) {
    throw new MissingFontError(options.fontPath);
  }
  pdf.registerFontkit(fontkit);
  const fontBytes = new Uint8Array(readFileSync(fontFullPath));
  const font = await pdf.embedFont(fontBytes);

  // Draw field values onto first page
  const page = pdf.getPages()[0];
  for (const field of activeFields) {
    const value = values[field.key] ?? "";
    if (!value) continue;
    const fontSize = field.size ?? DEFAULT_FONT_SIZE;
    const drawX =
      field.width !== undefined ? field.x + DEFAULT_X_PADDING : field.x;
    const drawY =
      field.height !== undefined
        ? field.y + Math.max((field.height - fontSize) / 2, 1)
        : field.y;
    page.drawText(value, {
      x: drawX,
      y: drawY,
      size: fontSize,
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
