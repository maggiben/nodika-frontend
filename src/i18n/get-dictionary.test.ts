import { describe, expect, test } from "vitest";
import { getDictionary } from "./get-dictionary";

describe("getDictionary", () => {
  test("loads Spanish and English dictionaries", async () => {
    const es = await getDictionary("es");
    const en = await getDictionary("en");
    expect(es.nav.signIn).toBe("Iniciar sesión");
    expect(en.nav.signIn).toBe("Sign in");
  });
});
