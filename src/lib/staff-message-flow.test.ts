import { describe, expect, it } from "vitest";

import {
  emptyFlowDraft,
  parseMessageFlow,
  parseMessageFlows,
  parseMessageFlowRun,
  validateFlowUpsertBody,
} from "@/lib/staff-message-flow";

const sampleFlow = {
  _id: "f1",
  name: "Asistencia",
  active: true,
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
      match: { type: "equals", value: "ok" },
    },
  ],
};

describe("staff-message-flow parsers", () => {
  it("parses a valid flow list", () => {
    expect(parseMessageFlows([sampleFlow])).toHaveLength(1);
    expect(parseMessageFlow(sampleFlow)?.name).toBe("Asistencia");
  });

  it("rejects malformed flows", () => {
    expect(
      parseMessageFlow({ ...sampleFlow, nodes: [{ id: "a" }] }),
    ).toBeNull();
    expect(parseMessageFlows(null)).toEqual([]);
  });

  it("parses flow runs", () => {
    expect(
      parseMessageFlowRun({
        _id: "r1",
        flowId: "f1",
        contactId: "c1",
        currentNodeId: "a",
        status: "awaiting_reply",
        stepCount: 1,
        lastOutboundMessageId: null,
      }),
    ).toMatchObject({ status: "awaiting_reply", stepCount: 1 });
    expect(parseMessageFlowRun({ _id: "r1" })).toBeNull();
  });

  it("validates upsert bodies and empty drafts", () => {
    const draft = emptyFlowDraft("Test");
    expect(validateFlowUpsertBody(draft)).toMatchObject({ name: "Test" });
    expect(validateFlowUpsertBody({ ...draft, active: false })?.active).toBe(
      false,
    );
    expect(validateFlowUpsertBody({ ...draft, name: "  " })).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        startNodeId: "missing",
      }),
    ).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        nodes: [
          {
            ...draft.nodes[0],
            title: "  ",
          },
        ],
      }),
    ).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        edges: [
          {
            id: "e1",
            fromNodeId: "missing",
            toNodeId: draft.startNodeId,
            match: { type: "contains", value: "x" },
          },
        ],
      }),
    ).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        edges: [
          {
            id: "e1",
            fromNodeId: draft.startNodeId,
            toNodeId: draft.startNodeId,
            match: { type: "equals", value: "  " },
          },
        ],
      }),
    ).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        nodes: [
          {
            id: "a",
            title: "Ask",
            body: "Hi",
            // missing position
          },
        ],
      }),
    ).toBeNull();
    expect(
      validateFlowUpsertBody({
        ...draft,
        edges: [
          {
            id: "e1",
            fromNodeId: draft.startNodeId,
            toNodeId: draft.startNodeId,
            match: { type: "startsWith", value: "x" },
          },
        ],
      }),
    ).toBeNull();
  });

  it("parses optional run outbound id and rejects bad edges", () => {
    expect(
      parseMessageFlowRun({
        _id: "r1",
        flowId: "f1",
        contactId: "c1",
        currentNodeId: "a",
        status: "completed",
        stepCount: 2,
        lastOutboundMessageId: "m1",
      })?.lastOutboundMessageId,
    ).toBe("m1");
    expect(
      parseMessageFlow({
        ...sampleFlow,
        edges: [
          {
            id: "e1",
            fromNodeId: "a",
            toNodeId: "a",
            match: { type: "equals" },
          },
        ],
      }),
    ).toBeNull();
  });
});
