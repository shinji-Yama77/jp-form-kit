import type { OverlayFormSchema } from "../../types.js";

// ⚠️ COORDINATES NEED REMAPPING
// The source PDF was replaced with the English version (Application for Certificate of Residence).
// All x/y values below are from the old Japanese PDF and will be misaligned.
// Re-run the coordinate picker against the new juminhyo.pdf before using in production.

export const juminhyoSchema: OverlayFormSchema = {
  id: "juminhyo",
  titleJa: "住民票等請求書",
  titleEn: "Resident record request",
  pdfFilename: "juminhyo.pdf",
  downloadName: "juminhyo.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/",
  category: "ward",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-02-06",
  verificationLocation: "港区役所 official website — city.minato.tokyo.jp",
  warningThresholdDays: 180,
  description:
    "Request a copy of your resident record — required for almost every other procedure",
  variants: [
    {
      lang: "en",
      pdfFilename: "juminhyo-en.pdf",
      downloadName: "juminhyo-en.pdf",
      sourceUrl: "https://www.city.minato.tokyo.jp/",
    },
  ],
  fields: [
    { key: "application_year", x: 372, y: 745 },
    { key: "application_month", x: 448, y: 745 },
    { key: "application_day", x: 505, y: 745 },
    {
      key: "furigana",
      x: 93,
      y: 725,
      labelEn: "Name (Katakana)",
      labelJa: "フリガナ",
    },
    {
      key: "name",
      x: 111,
      y: 697,
      labelEn: "Full Name",
      labelJa: "氏名",
      required: true,
    },
    {
      key: "address",
      x: 144,
      y: 664,
      labelEn: "Current Address",
      labelJa: "現住所",
      required: true,
    },
    {
      key: "dob_year",
      vaultKey: "dob",
      x: 192,
      y: 631,
      labelEn: "Date of Birth",
      labelJa: "生年月日",
      required: true,
    },
    { key: "dob_month", vaultKey: "dob", x: 264, y: 631 },
    { key: "dob_day", vaultKey: "dob", x: 315, y: 631 },
    { key: "phone", x: 441, y: 633, labelEn: "Phone", labelJa: "電話番号" },
    { key: "name_2", x: 101, y: 425 },
    { key: "dob_year_2", vaultKey: "dob", x: 485, y: 431 },
    { key: "dob_month_2", vaultKey: "dob", x: 520, y: 431 },
    { key: "dob_day_2", vaultKey: "dob", x: 545, y: 431 },
    { key: "address_2", x: 100, y: 379 },
    { key: "phone_2", x: 438, y: 378 },
  ],
};
