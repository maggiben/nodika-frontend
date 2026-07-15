// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { HtmlLang } from "./html-lang";

afterEach(cleanup);

describe("HtmlLang", () => {
  test("sets the document language to the active locale", () => {
    document.documentElement.lang = "en";
    render(<HtmlLang locale="es" />);
    expect(document.documentElement.lang).toBe("es");
  });
});
