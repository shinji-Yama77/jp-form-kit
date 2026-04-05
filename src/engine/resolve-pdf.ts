import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { OverlayFormSchema } from "../types.js";
import { MissingPdfError } from "./errors.js";

/**
 * Resolves the blank source PDF for a schema from a local asset directory.
 * Throws MissingPdfError with a clear message if the file is not found.
 */
export function resolvePdfBytes(schema: OverlayFormSchema, assetRoot: string): Uint8Array {
  const fullPath = join(assetRoot, schema.pdfFilename);
  if (!existsSync(fullPath)) {
    throw new MissingPdfError(schema.pdfFilename, assetRoot);
  }
  return new Uint8Array(readFileSync(fullPath));
}
