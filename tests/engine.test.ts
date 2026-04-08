import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import {
  MissingFontError,
  MissingPdfError,
  UnknownSchemaError,
  getPdfPath,
  renderOverlayPdf,
} from "../src/engine/index.js";
import { juminhyoSchema } from "../src/forms/minato/juminhyo.js";

describe("engine errors", () => {
  it("exposes MissingPdfError as an Error subclass", () => {
    const error = new MissingPdfError("form.pdf", "/tmp/form.pdf");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MissingPdfError);
  });

  it("exposes MissingFontError as an Error subclass", () => {
    const error = new MissingFontError("/tmp/font.ttf");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MissingFontError);
  });

  it("exposes UnknownSchemaError as an Error subclass", () => {
    const error = new UnknownSchemaError("missing-schema");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(UnknownSchemaError);
  });
});

describe("getPdfPath", () => {
  it("composes the expected asset-root path", () => {
    expect(getPdfPath(juminhyoSchema, "forms")).toBe(
      "forms/minato-ku/juminhyo/juminhyo.pdf",
    );
  });
});

describe("renderOverlayPdf", () => {
  it("throws MissingPdfError for a nonexistent explicit pdfPath", async () => {
    await expect(
      renderOverlayPdf(
        juminhyoSchema,
        {},
        {
          pdfPath: "forms/does-not-exist.pdf",
          fontPath: "assets/NotoSansJP-Regular.ttf",
        },
      ),
    ).rejects.toBeInstanceOf(MissingPdfError);
  });

  it("throws MissingPdfError when no pdfPath or assetRoot is provided", async () => {
    await expect(
      renderOverlayPdf(
        juminhyoSchema,
        {},
        {
          fontPath: "assets/NotoSansJP-Regular.ttf",
        },
      ),
    ).rejects.toBeInstanceOf(MissingPdfError);
  });

  it("throws UnknownSchemaError for an unknown schema id", async () => {
    await expect(
      renderOverlayPdf(
        "missing-schema",
        {},
        {
          pdfPath: "forms/juminhyo.pdf",
          fontPath: "assets/NotoSansJP-Regular.ttf",
        },
      ),
    ).rejects.toBeInstanceOf(UnknownSchemaError);
  });

  it("throws MissingFontError for a nonexistent explicit fontPath", async () => {
    await expect(
      renderOverlayPdf(
        juminhyoSchema,
        {},
        {
          pdfPath: "forms/juminhyo.pdf",
          fontPath: "assets/does-not-exist.ttf",
        },
      ),
    ).rejects.toBeInstanceOf(MissingFontError);
  });

  it("renders a PDF as Uint8Array using real fixtures", async () => {
    const bytes = await renderOverlayPdf(
      "juminhyo",
      {
        name: "SMITH JOHN",
      },
      {
        pdfPath: "forms/juminhyo.pdf",
        fontPath: "assets/NotoSansJP-Regular.ttf",
      },
    );

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(bytes.subarray(0, 4)).toString("utf8")).toBe("%PDF");
  });
});
