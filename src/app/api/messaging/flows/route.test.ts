import { describe, expect, it } from "vitest";

import { validateFlowUpsertBody } from "@/lib/staff-message-flow";

describe("flows BFF validation", () => {
  it("rejects malformed create bodies before proxying", () => {
    expect(validateFlowUpsertBody(null)).toBeNull();
    expect(validateFlowUpsertBody({ name: "x" })).toBeNull();
    expect(
      validateFlowUpsertBody({
        name: "Asistencia",
        startNodeId: "a",
        nodes: [
          {
            id: "a",
            title: "Ask",
            body: "¿Cómo fue?",
            position: { x: 0, y: 0 },
          },
        ],
        edges: [
          {
            id: "e1",
            fromNodeId: "a",
            toNodeId: "a",
            match: { type: "equals", value: "" },
          },
        ],
      }),
    ).toBeNull();
  });
});
