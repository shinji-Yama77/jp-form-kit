import type { OverlayFormSchema } from "../../types.js";

export const juminhyoMailSchema: OverlayFormSchema = {
  id: "juminhyo-mail",
  titleJa: "住民票等請求書",
  titleEn: "Resident Record Request",
  pdfFilename: "juminhyo-mail",
  sourceUrl:
    "https://www.city.minato.tokyo.jp/documents/9717/zyuuminnhyoutouseikyuusyo.pdf",
  category: "ward",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-04-12",
  fields: [
    {
      key: "application_year",
      x: 378,
      y: 738,
      labelEn: "Application Date",
      labelJa: "申請日",
    },
    {
      key: "application_month",
      x: 485,
      y: 722,
      labelEn: "Application Date",
      labelJa: "申請日",
    },
    {
      key: "application_day",
      x: 519,
      y: 729,
      labelEn: "Application Date",
      labelJa: "申請日",
    },
    {
      key: "requester_address",
      x: 180,
      y: 713,
      labelEn: "Requester Address",
      labelJa: "請求者の住所",
    },
    {
      key: "requester_name",
      x: 181,
      y: 686,
      labelEn: "Requester Name",
      labelJa: "請求者の氏名",
    },
    {
      key: "requester_phone",
      x: 412,
      y: 677,
      labelEn: "Requester Phone",
      labelJa: "請求者の電話番号",
    },
    {
      key: "subject_address",
      x: 206,
      y: 646,
      labelEn: "Subject Address",
      labelJa: "必要な方の住所",
    },
    {
      key: "subject_name",
      x: 177,
      y: 622,
      labelEn: "Subject Name",
      labelJa: "必要な方の氏名",
    },
    {
      key: "subject_head_of_household_name",
      x: 446,
      y: 616,
      labelEn: "Subject Head of Household Name",
      labelJa: "必要な方の世帯主の氏名",
    },
  ],
};

// TODO: Fill in any remaining metadata placeholders before submitting.
// TODO: Verify every generated field against the blank PDF before submitting.
