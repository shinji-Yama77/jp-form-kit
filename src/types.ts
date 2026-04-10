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
  labelEn?: string; // English label for review UIs
  labelJa?: string; // Japanese label for review UIs
}

export interface FormVariant {
  lang: "ja" | "en"; // language of this PDF version
  pdfFilename: string; // filename for this language's PDF — consumer app controls the path
  sourceUrl: string; // URL where this specific PDF version was obtained
  lastVerifiedAt: string; // ISO 8601 date (YYYY-MM-DD) — when this specific variant PDF was last checked against the live form
  fields?: OverlayField[]; // optional variant-specific coordinates when this PDF layout differs from the base form
}

export interface OverlayFormSchema {
  id: string; // kebab-case, unique across all schemas
  titleJa: string; // official Japanese form title for display and review UIs
  titleEn: string; // English display title or translation for consumers that need it
  pdfFilename: string; // blank PDF filename; full path is resolved by the engine from assetRoot + schema metadata
  sourceUrl: string; // real government URL where the form was obtained — must be verifiable
  category: FormCategory;
  jurisdiction: string; // filterable issuer slug — e.g. "minato-ku", "national", "immigration-bureau", "smbc"
  lastVerifiedAt: string; // ISO 8601 date (YYYY-MM-DD) — when schema was last checked against the live form
  variants?: FormVariant[]; // additional language versions of the same form — variants may override coordinates when layouts differ
  fields: OverlayField[];
}
