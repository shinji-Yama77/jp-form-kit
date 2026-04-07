export type FormCategory =
  | "ward"
  | "immigration"
  | "pension"
  | "employment"
  | "banking"
  | "housing";

export interface OverlayField {
  key: string; // unique within this form — used as lookup key in the values map
  x: number; // x coordinate in PDF points, bottom-left origin
  y: number; // y coordinate in PDF points
  size?: number; // font size override (default: 9pt)
  vaultKey?: string; // if this field is a sub-part (e.g. dob_year), the parent data key (e.g. "dob")
  labelEn?: string; // English label for review UIs
  labelJa?: string; // Japanese label for review UIs
  required?: boolean;
}

export interface FormVariant {
  lang: "ja" | "en"; // language of this PDF version
  pdfFilename: string; // filename for this language's PDF — consumer app controls the path
  downloadName: string; // suggested filename when exporting this variant
  sourceUrl: string; // URL where this specific PDF version was obtained
}

export interface OverlayFormSchema {
  id: string; // kebab-case, unique across all schemas
  titleJa: string; // official Japanese form title
  titleEn: string; // English translation
  pdfFilename: string; // blank PDF filename; full path is resolved by the engine from assetRoot + schema metadata
  downloadName: string; // suggested filename for the exported PDF
  sourceUrl: string; // real government URL where the form was obtained — must be verifiable
  category: FormCategory;
  jurisdiction: string; // filterable issuer slug — e.g. "minato-ku", "national", "immigration-bureau", "smbc"
  lastVerifiedAt: string; // ISO 8601 date (YYYY-MM-DD) — when schema was last checked against the live form
  verificationLocation: string; // human-readable — e.g. "港区役所 official website — city.minato.tokyo.jp"
  pdfSha256?: string; // sha256 of the blank PDF at time of verification — run: shasum -a 256 form.pdf
  warningThresholdDays: number; // days before consuming apps should show a staleness warning
  description: string; // one-line English description
  variants?: FormVariant[]; // additional language versions of the same form — fields and coordinates are shared
  fields: OverlayField[];
}
