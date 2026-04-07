import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { OverlayFormSchema } from "../types.js";
import { MissingPdfError } from "./errors.js";

/**
 * Returns the expected blank PDF path for a schema under the asset root.
 * Convention: {assetRoot}/{jurisdiction}/{schema.id}/{pdfFilename}
 */
export function getPdfPath(
  schema: OverlayFormSchema,
  assetRoot: string,
): string {
  return join(assetRoot, schema.jurisdiction, schema.id, schema.pdfFilename);
}

/**
 * Resolves the blank source PDF for a schema from a local asset directory.
 * Throws MissingPdfError with a clear message if the file is not found.
 */
export function loadPdfBytes(
  fullPath: string,
  pdfFilename: string,
): Uint8Array {
  if (!existsSync(fullPath)) {
    throw new MissingPdfError(pdfFilename, fullPath);
  }
  return new Uint8Array(readFileSync(fullPath));
}

export function resolvePdfBytes(
  schema: OverlayFormSchema,
  assetRoot: string,
): Uint8Array {
  return loadPdfBytes(getPdfPath(schema, assetRoot), schema.pdfFilename);
}
