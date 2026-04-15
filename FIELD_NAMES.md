# Field Names

Canonical field names for `jp-form-kit` form schemas and annotation labels.

Contributors should use these exact keys when:

- annotating PDFs in Preview
- generating new schema files
- reviewing field consistency across forms

## Naming Conventions

- Use `lowercase_snake_case`
- Use `_year`, `_month`, `_day` for split date fields
- Keep keys stable once published; renaming an existing key is a breaking change
- Prefer semantic names that match the meaning of the field
- Use role prefixes like `counter_visitor_` and `requester_` when the same form contains multiple people
- Reuse the same canonical key across Japanese and English variants when they represent the same concept

## Canonical Keys

| Key                       | English Meaning              | Japanese Label             | Example Value         | Notes                                         |
| ------------------------- | ---------------------------- | -------------------------- | --------------------- | --------------------------------------------- |
| `furigana`                | Name in kana                 | フリガナ                   | ヤマダ タロウ         | Usually katakana reading                      |
| `full_name`               | Full name                    | 氏名                       | 山田 太郎             | General full-name field                       |
| `home_address`            | Home address                 | 住所 / 現住所 / 新住所     | 東京都港区六本木3-1-1 | Use when the form clearly means residence     |
| `contact_phone`           | Daytime contact phone number | 昼間連絡のつく電話番号     | 09012345678           | Use when the form explicitly asks for contact |
| `head_of_household_name`  | Head of household name       | 世帯主の氏名               | 山田 一郎             | Household registry concept                    |
| `dob_year`                | Birth year                   | 生年月日                   | 1990                  | Split date field                              |
| `dob_month`               | Birth month                  | 生年月日                   | 03                    | Split date field                              |
| `dob_day`                 | Birth day                    | 生年月日                   | 15                    | Split date field                              |
| `application_year`        | Application year             | 申請日                     | 2026                  | Date the form is submitted/requested          |
| `application_month`       | Application month            | 申請日                     | 04                    | Date the form is submitted/requested          |
| `application_day`         | Application day              | 申請日                     | 06                    | Date the form is submitted/requested          |
| `move_year`               | Move-in year                 | 転入日                     | 2026                  | Split move date field                         |
| `move_month`              | Move-in month                | 転入日                     | 04                    | Split move date field                         |
| `move_day`                | Move-in day                  | 転入日                     | 01                    | Split move date field                         |
| `counter_visitor_name`    | Counter visitor name         | 窓口に来られた方の氏名     | 山田 花子             | Role-specific section key                     |
| `counter_visitor_address` | Counter visitor address      | 窓口に来られた方の住所     | 東京都港区六本木3-1-1 | Role-specific section key                     |
| `counter_visitor_phone`   | Counter visitor phone        | 窓口に来られた方の電話番号 | 0312345678            | Role-specific section key                     |
| `requester_name`          | Requester name               | 請求者の氏名               | 山田 太郎             | Role-specific section key                     |
| `requester_address`       | Requester address            | 請求者の住所               | 東京都港区六本木3-1-1 | Role-specific section key                     |
| `requester_phone`         | Requester phone              | 請求者の電話番号           | 09012345678           | Role-specific section key                     |

## Notes

- These keys are derived from the current published schemas and the current annotation workflow.
- New keys should be added carefully and only when an existing canonical key does not fit.
- Japanese and English variants should use the same canonical keys whenever the fields mean the same thing, even if the coordinates differ.
