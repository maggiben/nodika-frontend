import { describe, expect, test } from "vitest";
import {
  defaultProgressAi,
  isAllowedProgressAiModel,
  isProgressAiSettings,
  modelForProviderChange,
  modelsForProvider,
} from "./progress-ai";

describe("progress-ai helpers", () => {
  test("lists models per provider", () => {
    expect(modelsForProvider("openai")).toContain("gpt-4o-mini");
    expect(modelsForProvider("anthropic")).toContain("claude-sonnet-4-5");
    expect(isAllowedProgressAiModel("anthropic", "gpt-4o")).toBe(false);
  });

  test("validates progressAi settings shape", () => {
    expect(
      isProgressAiSettings({
        provider: "anthropic",
        model: "claude-haiku-4-5",
      }),
    ).toBe(true);
    expect(isProgressAiSettings({ provider: "openai", model: "unknown" })).toBe(
      false,
    );
  });

  test("resets model when switching providers if needed", () => {
    expect(modelForProviderChange("anthropic", "gpt-4o")).toBe(
      "claude-sonnet-4-5",
    );
    expect(modelForProviderChange("openai", "gpt-4o")).toBe("gpt-4o");
  });

  test("build save payload shape for settings PATCH", () => {
    const current = defaultProgressAi({
      provider: "anthropic",
      model: "claude-sonnet-4-5",
    });
    const patchBody = {
      progressAi: {
        provider: current.provider,
        model: current.model,
      },
    };
    expect(patchBody).toEqual({
      progressAi: {
        provider: "anthropic",
        model: "claude-sonnet-4-5",
      },
    });
    expect(JSON.stringify(patchBody)).not.toMatch(/api[_-]?key/i);
  });
});
