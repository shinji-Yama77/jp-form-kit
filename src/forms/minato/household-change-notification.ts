import type { OverlayFormSchema } from "../../types.js";

export const householdChangeNotificationSchema: OverlayFormSchema = {
  id: "household-change-notification",
  titleJa: "申出書",
  titleEn: "Notification for change of household and others",
  pdfFilename: "household-change-notification.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/documents/9717/moushidesho.pdf",
  category: "ward",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-04-14",
  fields: [
    {
      key: "counter_visitor_name",
      x: 100,
      y: 667,
      labelEn: "Counter Visitor Name",
      labelJa: "窓口に来られた方の氏名",
    },
    {
      key: "counter_visitor_phone",
      x: 449,
      y: 667,
      labelEn: "Counter Visitor Phone",
      labelJa: "窓口に来られた方の電話番号",
    },
    {
      key: "counter_visitor_address",
      x: 106,
      y: 632,
      labelEn: "Counter Visitor Address",
      labelJa: "窓口に来られた方の住所",
    },
    {
      key: "home_address",
      x: 145,
      y: 389,
      labelEn: "Home Address",
      labelJa: "住所",
    },
    {
      key: "new_address",
      x: 99,
      y: 353,
      labelEn: "New Address",
      labelJa: "新しい住所",
    },
    {
      key: "subject_furigana",
      x: 27,
      y: 256,
      labelEn: "Subject Name (Katakana)",
      labelJa: "必要な方のフリガナ",
    },
    {
      key: "subject_name",
      x: 28,
      y: 235,
      labelEn: "Subject Name",
      labelJa: "必要な方の氏名",
    },
    {
      key: "notification_contents",
      x: 102,
      y: 436,
      labelEn: "Notification Details",
      labelJa: "届出内容",
    },
  ],
};

// TODO: Fill in any remaining metadata placeholders before submitting.
// TODO: Verify every generated field against the blank PDF before submitting.
