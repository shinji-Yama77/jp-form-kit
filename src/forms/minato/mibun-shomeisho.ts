import type { OverlayFormSchema } from "../../types.js";

export const mibunShomeishoSchema: OverlayFormSchema = {
  id: "mibun-shomeisho",
  titleJa: "身分証明書交付申請書",
  titleEn: "Application for Issuance of Identity Certificate",
  pdfFilename: "mibun-shomeisho.pdf",
  sourceUrl:
    "https://www.city.minato.tokyo.jp/documents/9717/20260206081613.pdf",
  category: "ward",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-04-13",
  fields: [
    {
      key: "subject_head_of_household_name",
      x: 163,
      y: 571,
      labelEn: "Subject Head of Household Name",
      labelJa: "必要な方の世帯主の氏名",
    },
    {
      key: "subject_furigana",
      x: 164,
      y: 544,
      labelEn: "Subject Name (Katakana)",
      labelJa: "必要な方のフリガナ",
    },
    {
      key: "subject_name",
      x: 163,
      y: 517,
      labelEn: "Subject Name",
      labelJa: "必要な方の氏名",
    },
    {
      key: "subject_address",
      x: 163,
      y: 479,
      labelEn: "Subject Address",
      labelJa: "必要な方の住所",
    },
    {
      key: "subject_dob_year",
      x: 232,
      y: 442,
      labelEn: "Subject Date of Birth",
      labelJa: "必要な方の生年月日",
    },
    {
      key: "subject_dob_month",
      x: 358,
      y: 436,
      labelEn: "Subject Date of Birth",
      labelJa: "必要な方の生年月日",
    },
    {
      key: "subject_dob_day",
      x: 427,
      y: 437,
      labelEn: "Subject Date of Birth",
      labelJa: "必要な方の生年月日",
    },
    {
      key: "counter_visitor_name",
      x: 162,
      y: 286,
      labelEn: "Counter Visitor Name",
      labelJa: "窓口に来られた方の氏名",
    },
    {
      key: "counter_visitor_address",
      x: 162,
      y: 255,
      labelEn: "Counter Visitor Address",
      labelJa: "窓口に来られた方の住所",
    },
    {
      key: "counter_visitor_phone",
      x: 164,
      y: 226,
      labelEn: "Counter Visitor Phone",
      labelJa: "窓口に来られた方の電話番号",
    },
  ],
};

// TODO: Fill in any remaining metadata placeholders before submitting.
// TODO: Verify every generated field against the blank PDF before submitting.
