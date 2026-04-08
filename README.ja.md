# jp-form-kit

[English](./README.md) | 日本語

`jp-form-kit` は、日本の行政手続きで使われる PDF フォーム向けの TypeScript パッケージです。

このパッケージには、以下が含まれます。

- 型付きフォームスキーマ
- フォームのメタデータとフィールド座標
- Node.js 向けの PDF オーバーレイエンジン

既知の PDF フォームに対して値を重ね書きしたいアプリやスクリプトで、フォーム定義や座標管理を毎回ゼロから作り直さずに使えることを目的としています。

## このパッケージでできること

- 日本の申請書 PDF 向けの型付きスキーマを利用する
- スキーマに基づいて PDF に文字を描画する
- 同じ構造を使ってフォーム定義を追加・保守する

## このパッケージでやらないこと

- ブラウザ中心の API 提供
- すべての日本の行政フォームの収録
- 公式の空 PDF を npm パッケージに同梱すること

## インストール

```bash
npm install jp-form-kit
```

## 使用例

```ts
import { renderOverlayPdfToFile } from "jp-form-kit";

await renderOverlayPdfToFile(
  "juminhyo",
  {
    name: "SMITH JOHN",
    address: "東京都港区六本木3-1-1",
    dob_year: "1990",
    dob_month: "03",
    dob_day: "15",
  },
  {
    assetRoot: "./pdfs",
    fontPath: "./fonts/NotoSansJP-Regular.ttf",
  },
  "./output/juminhyo-filled.pdf",
);
```

## PDF 配置ルール

オーバーレイエンジンは、空 PDF を次のディレクトリ規約で探します。

```text
{assetRoot}/{jurisdiction}/{schema.id}/{pdfFilename}
```

例:

```text
pdfs/
  minato-ku/
    juminhyo/
      juminhyo.pdf
    tenin/
      tenin.pdf
```

`assetRoot: "./pdfs"` を渡した場合、`juminhyo` は次のパスとして解決されます。

```text
./pdfs/minato-ku/juminhyo/juminhyo.pdf
```

期待されるパスは `getPdfPath` でも確認できます。

```ts
import { getPdfPath, juminhyoSchema } from "jp-form-kit";

const path = getPdfPath(juminhyoSchema, "./pdfs");
```

## 主なエクスポート

- `allForms`
- `FormCategory`
- `OverlayField`
- `FormVariant`
- `OverlayFormSchema`
- 各フォームスキーマ
- `renderOverlayPdf`
- `renderOverlayPdfToFile`
- `getPdfPath`
- `MissingPdfError`
- `MissingFontError`
- `UnknownSchemaError`
- `UnknownVariantError`

## エンジン API

### `renderOverlayPdf(schema, values, options)`

値を空 PDF に描画し、生成後の PDF バイト列を `Uint8Array` で返します。

- `schema`: `OverlayFormSchema` または `"juminhyo"` のようなスキーマ ID
- `values`: フィールドキーと描画文字列の対応表
- `options.assetRoot`: 空 PDF を配置したルートディレクトリ
- `options.variantLang`: 利用する言語バリアント。指定した場合、そのバリアントの `pdfFilename` と座標を優先
- `options.fontPath`: 日本語描画に対応した `.ttf` フォントへのパス

### `renderOverlayPdfToFile(schema, values, options, outputPath)`

PDF を生成し、そのままファイルに書き出すためのラッパーです。

## スキーマ構造

各フォームスキーマには主に以下が含まれます。

- `id`, `titleJa`, `titleEn`, `category`, `jurisdiction` などの基本情報
- `sourceUrl`, `lastVerifiedAt`, `verificationLocation` などの検証情報
- `pdfFilename`, `downloadName` などのファイル情報
- フィールド座標を持つ `fields` 配列

座標は PDF の point 単位で、原点は左下です。これは `pdf-lib` の描画座標系と一致します。

## バリアントについて

`variants` は、別言語版 PDF のための補助情報です。必要なら、そのバリアント専用の `fields` を持てます。

つまり、`variants` では:

- 同じ座標を共有してもよい
- あるいは `variant.fields` で別座標を定義してもよい

レイアウトが異なる場合は `variant.fields` を定義し、描画時に `options.variantLang` を指定します。

## 検証方針

このパッケージは、スキーマの信頼性が高くないと意味がありません。

- `sourceUrl` は必ず公式の取得元 URL にする
- `lastVerifiedAt` は実際に確認した日付だけを入れる
- 座標は推測ではなく、決められたワークフローで取得する
- 公式 PDF が更新されたら座標の再確認が必要になることがある

## コントリビュート

フォーム追加や座標修正のコントリビュートを歓迎します。

詳しい手順は [`CONTRIBUTING.md`](./CONTRIBUTING.md) を参照してください。

## 公開方針

npm に公開するのは `dist/` のコードです。空の公式 PDF は v1 では同梱せず、利用側でローカルのアセットディレクトリに配置する前提です。

## ステータス

初期リリースでは、広いカバレッジよりも、少数の高価値フォームを正確なスキーマと動作する Node.js オーバーレイフローで提供することを優先します。
