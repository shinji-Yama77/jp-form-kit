import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync } from "fs";
import { isAbsolute, join } from "path";

export function resolveInputPath(inputPath, envRootVarName = "FORM_ROOT") {
  const root = process.env[envRootVarName];

  if (root && !isAbsolute(inputPath) && !inputPath.startsWith(".")) {
    return join(root, inputPath);
  }

  return inputPath;
}

export function getAnnotationLabel(annotation) {
  return annotation.textContent?.join("").trim() ?? annotation.contentsObj?.str?.trim() ?? "";
}

export async function readFreeTextAnnotations(pdfPath, envRootVarName = "FORM_ROOT") {
  const resolvedPdfPath = resolveInputPath(pdfPath, envRootVarName);
  const data = new Uint8Array(readFileSync(resolvedPdfPath));
  const doc = await getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const annotations = await page.getAnnotations();

  return annotations
    .filter((annotation) => annotation.subtype === "FreeText")
    .map((annotation) => {
      const rect = annotation.rect?.map((value) => Math.round(value)) ?? [];

      return {
        label: getAnnotationLabel(annotation),
        x: rect[0],
        y: rect[1],
        width: rect[2] - rect[0],
        height: rect[3] - rect[1],
        rect,
      };
    });
}
