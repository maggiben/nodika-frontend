import { describe, expect, test } from "vitest";

import { defaultLocale, isLocale, locales } from "./config";

describe("i18n config", () => {
  test("defaults to Spanish and recognizes supported locales", () => {
    expect(defaultLocale).toBe("es");
    expect(locales).toEqual(["es", "en"]);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
  });
});
