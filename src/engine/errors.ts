export class MissingPdfError extends Error {
  constructor(pdfFilename: string, expectedPath: string) {
    super(
      `Missing blank PDF: "${pdfFilename}" not found at "${expectedPath}".\n` +
        `Download the blank form from the schema's sourceUrl and place it at that exact path.`,
    );
    this.name = "MissingPdfError";
  }
}

export class MissingFontError extends Error {
  constructor(fontPath: string) {
    super(
      `Missing font file: "${fontPath}" not found.\n` +
        `A Japanese-capable font (e.g. NotoSansJP-Regular.ttf) is required to render text on Japanese forms.\n` +
        `Download it and pass the path via options.fontPath.`,
    );
    this.name = "MissingFontError";
  }
}

export class UnknownSchemaError extends Error {
  constructor(schemaId: string) {
    super(
      `Unknown schema id: "${schemaId}".\n` +
        `Available ids: import { allForms } from "jp-form-kit" and check allForms.map(f => f.id).`,
    );
    this.name = "UnknownSchemaError";
  }
}

export class UnknownVariantError extends Error {
  constructor(schemaId: string, variantLang: string) {
    super(
      `Unknown variant "${variantLang}" for schema "${schemaId}".\n` +
        `Check schema.variants to see which language variants are available.`,
    );
    this.name = "UnknownVariantError";
  }
}
