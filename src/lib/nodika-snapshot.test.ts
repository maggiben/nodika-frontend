import { describe, expect, test } from "vitest";
import { parseNodikaSnapshot, validateNodikaSnapshot } from "./nodika-snapshot";

describe("validateNodikaSnapshot", () => {
  test("accepts any JSON object", () => {
    expect(
      validateNodikaSnapshot({
        schema_version: "custom",
        extra: true,
        tareas_con_objetivo: [],
      }).success,
    ).toBe(true);
  });

  test("rejects arrays and primitives", () => {
    expect(validateNodikaSnapshot([]).success).toBe(false);
    expect(validateNodikaSnapshot("snapshot").success).toBe(false);
  });
});

describe("parseNodikaSnapshot", () => {
  test("accepts loosely shaped snapshot JSON", () => {
    const result = parseNodikaSnapshot(`{
      "schema_version": "nodika-snapshot-v1",
      "meta": { "projectId": "proj_1" },
      "tareas_con_objetivo": [{ "id": "task_1", "duracionn": 30 }]
    }`);

    expect(result.success).toBe(true);
  });

  test("reports JSON syntax errors like JSONLint", () => {
    const result = parseNodikaSnapshot(`{ "broken": true, }`);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0]?.path).toBe("root");
      expect(result.errors[0]?.message).toMatch(/Invalid JSON syntax/i);
    }
  });
});
