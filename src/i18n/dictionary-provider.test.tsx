// @vitest-environment jsdom

import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { useDictionary } from "./dictionary-provider";

describe("DictionaryProvider", () => {
  test("requires a provider for useDictionary", () => {
    function Broken() {
      useDictionary();
      return null;
    }

    expect(() => render(<Broken />)).toThrow(/DictionaryProvider/);
  });
});
