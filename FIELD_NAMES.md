# Field Names

Canonical field names for `jp-form-kit` form schemas and annotation labels.

Contributors should use these exact keys when:

- annotating PDFs in Preview
- generating new schema files
- reviewing field consistency across forms

## Naming Conventions

- Use `lowercase_snake_case`
- Use `_year`, `_month`, `_day` for split date fields
- Use `_2` for a second repeated person or household section
- Keep keys stable once published; renaming an existing key is a breaking change
- Prefer short, generic, reusable names over form-specific wording where possible

## Canonical Keys

| Key | English Meaning | Japanese Label | Example Value | Notes |
| --- | --- | --- | --- | --- |
| `name` | Full name | 氏名 | 山田 太郎 | Primary applicant/person name |
| `furigana` | Name in kana | フリガナ | ヤマダ タロウ | Usually katakana reading |
| `address` | Address | 住所 / 現住所 / 新住所 | 東京都港区六本木3-1-1 | Meaning may vary slightly by form |
| `phone` | Phone number | 電話番号 | 09012345678 | Hyphens optional depending on form |
| `dob_year` | Birth year | 生年月日 | 1990 | Split date field |
| `dob_month` | Birth month | 生年月日 | 03 | Split date field |
| `dob_day` | Birth day | 生年月日 | 15 | Split date field |
| `application_year` | Application year | 申請日 | 2026 | Date the form is submitted/requested |
| `application_month` | Application month | 申請日 | 04 | Date the form is submitted/requested |
| `application_day` | Application day | 申請日 | 06 | Date the form is submitted/requested |
| `submit_year` | Submission year | 提出日 | 2026 | Generic submit date field |
| `submit_month` | Submission month | 提出日 | 04 | Generic submit date field |
| `submit_day` | Submission day | 提出日 | 06 | Generic submit date field |
| `move_year` | Move-in year | 転入日 | 2026 | Split move date field |
| `move_month` | Move-in month | 転入日 | 04 | Split move date field |
| `move_day` | Move-in day | 転入日 | 01 | Split move date field |
| `name_2` | Secondary name | 氏名 | 山田 花子 | Second repeated person section |
| `furigana_2` | Secondary kana name | フリガナ | ヤマダ ハナコ | Second repeated person section |
| `address_2` | Secondary address | 住所 | 東京都港区六本木3-1-1 | Second repeated person section |
| `phone_2` | Secondary phone number | 電話番号 | 0312345678 | Second repeated person section |
| `dob_year_2` | Secondary birth year | 生年月日 | 1992 | Second repeated person section |
| `dob_month_2` | Secondary birth month | 生年月日 | 07 | Second repeated person section |
| `dob_day_2` | Secondary birth day | 生年月日 | 21 | Second repeated person section |

## Notes

- These keys are derived from the current `juminhyo` and `tenin` schemas.
- New keys should be added carefully and only when an existing canonical key does not fit.
- If two PDF variants have different layouts, use separate schemas even if the labels are similar.
