import { readFileSync, existsSync } from "fs";
import { MissingPdfError } from "./errors.js";

/**
 * Loads a blank source PDF from an explicit local file path.
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
