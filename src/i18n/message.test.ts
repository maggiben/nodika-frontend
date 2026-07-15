import { describe, expect, test } from "vitest";
import { formatMessage, getMessage } from "./message";

describe("i18n message helpers", () => {
  test("formats placeholders and resolves nested paths", () => {
    expect(formatMessage("{count} tasks", { count: 3 })).toBe("3 tasks");
    expect(formatMessage("Hello {name}", {})).toBe("Hello {name}");
    expect(
      getMessage(
        { dashboard: { emptyTitle: "Estado del proyecto" } },
        "dashboard.emptyTitle",
      ),
    ).toBe("Estado del proyecto");
    expect(getMessage({}, "missing.key")).toBe("missing.key");
    expect(
      getMessage({ dashboard: { nested: { a: 1 } } }, "dashboard.nested"),
    ).toBe("dashboard.nested");
  });
});
