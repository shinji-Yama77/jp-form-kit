import { describe, expect, it } from "vitest";
import { allForms } from "../src/forms/index.js";
import type { FormCategory, FormVariant, OverlayField } from "../src/types.js";

const FORM_CATEGORIES: FormCategory[] = [
  "ward",
  "immigration",
  "pension",
  "employment",
  "banking",
  "housing",
];

const REQUIRED_SCHEMA_STRING_FIELDS = [
  "id",
  "titleJa",
  "titleEn",
  "pdfFilename",
  "sourceUrl",
  "jurisdiction",
  "lastVerifiedAt",
] as const;

const REQUIRED_VARIANT_STRING_FIELDS = [
  "lang",
  "pdfFilename",
  "sourceUrl",
  "lastVerifiedAt",
] as const;

const KEBAB_CASE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function expectParseableUrl(value: string) {
  expect(() => new URL(value)).not.toThrow();
}

function expectValidField(field: OverlayField) {
  expect(isNonEmptyString(field.key)).toBe(true);
  expect(Number.isFinite(field.x)).toBe(true);
  expect(Number.isFinite(field.y)).toBe(true);
  expect(Number.isFinite(field.width)).toBe(true);
  expect(field.width).toBeGreaterThan(0);
  expect(Number.isFinite(field.height)).toBe(true);
  expect(field.height).toBeGreaterThan(0);
}

function expectValidVariant(variant: FormVariant) {
  for (const key of REQUIRED_VARIANT_STRING_FIELDS) {
    expect(isNonEmptyString(variant[key])).toBe(true);
  }
  expect(ISO_DATE_PATTERN.test(variant.lastVerifiedAt)).toBe(true);
  expectParseableUrl(variant.sourceUrl);
  for (const field of variant.fields ?? []) {
    expectValidField(field);
  }
}

describe("allForms", () => {
  it("is non-empty", () => {
    expect(allForms.length).toBeGreaterThan(0);
  });

  it("has unique schema ids", () => {
    const ids = allForms.map((schema) => schema.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe.each(allForms)("schema $id", (schema) => {
  it("has required non-empty string metadata", () => {
    for (const key of REQUIRED_SCHEMA_STRING_FIELDS) {
      expect(isNonEmptyString(schema[key])).toBe(true);
    }
  });

  it("uses a kebab-case id", () => {
    expect(schema.id).toMatch(KEBAB_CASE_PATTERN);
  });

  it("uses a valid category", () => {
    expect(FORM_CATEGORIES).toContain(schema.category);
  });

  it("uses a non-empty ISO-8601 verification date", () => {
    expect(isNonEmptyString(schema.lastVerifiedAt)).toBe(true);
    expect(ISO_DATE_PATTERN.test(schema.lastVerifiedAt)).toBe(true);
  });

  it("uses a parseable source URL", () => {
    expectParseableUrl(schema.sourceUrl);
  });

  it("defines valid overlay fields", () => {
    for (const field of schema.fields) {
      expectValidField(field);
    }
  });

  it("defines valid variants when present", () => {
    for (const variant of schema.variants ?? []) {
      expectValidVariant(variant);
    }
  });
});
