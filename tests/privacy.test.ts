import { expect, test } from "bun:test";
import {
  AVAILABLE_MODELS,
  getFallbackModels,
  isTEEModel,
  PII_DETECTION_FALLBACK_MODELS,
  requiresPIIAnonymization,
} from "../src/config/models";
import { readFileSync } from "node:fs";

test("every fallback stays on the selected privacy path", () => {
  for (const failed of AVAILABLE_MODELS) {
    const { models, recommendedId } = getFallbackModels(failed.id, "dansk");
    expect(models.length).toBeGreaterThan(0);
    expect(
      models.every((model) => model.pathType === failed.pathType && model.id !== failed.id)
    ).toBe(true);
    if (recommendedId) expect(models.some((model) => model.id === recommendedId)).toBe(true);
  }
  expect(
    getFallbackModels("unknown", "dansk").models.every((model) => model.pathType === "tee")
  ).toBe(true);
});
test("PII detection never selects a commercial provider", () => {
  expect(PII_DETECTION_FALLBACK_MODELS.length).toBeGreaterThan(0);
  for (const model of PII_DETECTION_FALLBACK_MODELS) expect(isTEEModel(model)).toBe(true);
  expect(requiresPIIAnonymization("unknown")).toBe(true);
});
test("locale keys match and every model label resolves", () => {
  const flatten = (value: Record<string, unknown>, prefix = ""): string[] =>
    Object.entries(value).flatMap(([key, item]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return item !== null && typeof item === "object"
        ? flatten(item as Record<string, unknown>, path)
        : [path];
    });
  const en = flatten(JSON.parse(readFileSync("src/lib/i18n/locales/en.json", "utf8"))).sort();
  const da = flatten(JSON.parse(readFileSync("src/lib/i18n/locales/da.json", "utf8"))).sort();
  expect(da).toEqual(en);
  for (const model of AVAILABLE_MODELS) {
    for (const key of [model.nameKey, model.descriptionKey, model.bestForKey])
      expect(en).toContain(key);
  }
});
test("vendored PDF worker matches the installed parser byte for byte", () => {
  expect(readFileSync("public/pdf.worker.min.mjs")).toEqual(
    readFileSync("node_modules/pdfjs-dist/build/pdf.worker.min.mjs")
  );
});
