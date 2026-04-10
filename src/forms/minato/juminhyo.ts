import type { OverlayFormSchema } from "../../types.js";




export const juminhyoSchema: OverlayFormSchema = {
  id: "juminhyo",
  titleJa: "住民票等請求書",
  titleEn: "Resident Record Request",
  pdfFilename: "住民票等請求書.pdf",
  sourceUrl: "https://www.city.minato.tokyo.jp/documents/9717/20260206101744.pdf",
  category: "ward",
  jurisdiction: "minato-ku",
  lastVerifiedAt: "2026-04-09",
  variants: [
    {
      lang: "en",
      pdfFilename: "juminhyo-en.pdf",
      sourceUrl: "https://www.city.minato.tokyo.jp/",
      lastVerifiedAt: "2026-04-09",
    }
  ],
  fields: [
    { key: "furigana", x: 84, y: 718, labelEn: "Name (Katakana)", labelJa: "フリガナ" },
    { key: "full_name", x: 85, y: 694, labelEn: "Full Name", labelJa: "氏名" },
    { key: "home_address", x: 128, y: 659, labelEn: "Home Address", labelJa: "住所" },
    { key: "contact_phone", x: 419, y: 626, labelEn: "Daytime Contact Phone Number", labelJa: "昼間連絡のつく電話番号" },
    { key: "head_of_household_name", x: 418, y: 694, labelEn: "Head of Household Name", labelJa: "世帯主の氏名" },
    { key: "counter_visitor_name", x: 84, y: 417, labelEn: "Counter Visitor Name", labelJa: "窓口に来られた方の氏名" },
    { key: "counter_visitor_address", x: 84, y: 372, labelEn: "Counter Visitor Address", labelJa: "窓口に来られた方の住所" },
    { key: "counter_visitor_phone", x: 418, y: 372, labelEn: "Counter Visitor Phone", labelJa: "窓口に来られた方の電話番号" },
    { key: "requester_name", x: 85, y: 315, labelEn: "Requester Name", labelJa: "請求者の氏名" },
    { key: "requester_address", x: 83, y: 280, labelEn: "Requester Address", labelJa: "請求者の住所" },
    { key: "requester_phone", x: 418, y: 288, labelEn: "Requester Phone", labelJa: "請求者の電話番号" },
  ],
};
