export type FlowMatchType = "equals" | "contains";

export type MessageFlowNode = {
  id: string;
  title: string;
  body: string;
  position: { x: number; y: number };
};

export type MessageFlowEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  match: { type: FlowMatchType; value: string };
};

export type MessageFlow = {
  _id: string;
  name: string;
  active: boolean;
  startNodeId: string;
  nodes: MessageFlowNode[];
  edges: MessageFlowEdge[];
};

export type MessageFlowRunStatus =
  "idle" | "awaiting_reply" | "completed" | "failed";

export type MessageFlowRun = {
  _id: string;
  flowId: string;
  contactId: string;
  currentNodeId: string;
  status: MessageFlowRunStatus;
  stepCount: number;
  lastOutboundMessageId: string | null;
};

export type FlowUpsertBody = {
  name: string;
  active?: boolean;
  startNodeId: string;
  nodes: MessageFlowNode[];
  edges: MessageFlowEdge[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parsePosition(value: unknown): { x: number; y: number } | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.x !== "number" || typeof value.y !== "number") {
    return null;
  }
  return { x: value.x, y: value.y };
}

function parseNode(value: unknown): MessageFlowNode | null {
  if (!isRecord(value)) {
    return null;
  }
  const position = parsePosition(value.position);
  if (
    typeof value.id !== "string" ||
    typeof value.title !== "string" ||
    typeof value.body !== "string" ||
    !position
  ) {
    return null;
  }
  return {
    id: value.id,
    title: value.title,
    body: value.body,
    position,
  };
}

function parseEdge(value: unknown): MessageFlowEdge | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.fromNodeId !== "string" ||
    typeof value.toNodeId !== "string" ||
    !isRecord(value.match)
  ) {
    return null;
  }
  const matchType = value.match.type;
  if (
    (matchType !== "equals" && matchType !== "contains") ||
    typeof value.match.value !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    fromNodeId: value.fromNodeId,
    toNodeId: value.toNodeId,
    match: { type: matchType, value: value.match.value },
  };
}

export function parseMessageFlow(payload: unknown): MessageFlow | null {
  if (!isRecord(payload)) {
    return null;
  }
  if (
    typeof payload._id !== "string" ||
    typeof payload.name !== "string" ||
    typeof payload.startNodeId !== "string" ||
    !Array.isArray(payload.nodes) ||
    !Array.isArray(payload.edges)
  ) {
    return null;
  }

  const nodes = payload.nodes
    .map(parseNode)
    .filter((node): node is MessageFlowNode => node !== null);
  const edges = payload.edges
    .map(parseEdge)
    .filter((edge): edge is MessageFlowEdge => edge !== null);

  if (nodes.length !== payload.nodes.length) {
    return null;
  }
  if (edges.length !== payload.edges.length) {
    return null;
  }

  return {
    _id: payload._id,
    name: payload.name,
    active: payload.active !== false,
    startNodeId: payload.startNodeId,
    nodes,
    edges,
  };
}

export function parseMessageFlows(payload: unknown): MessageFlow[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .map(parseMessageFlow)
    .filter((flow): flow is MessageFlow => flow !== null);
}

export function parseMessageFlowRun(payload: unknown): MessageFlowRun | null {
  if (!isRecord(payload)) {
    return null;
  }
  const status = payload.status;
  if (
    typeof payload._id !== "string" ||
    typeof payload.flowId !== "string" ||
    typeof payload.contactId !== "string" ||
    typeof payload.currentNodeId !== "string" ||
    typeof payload.stepCount !== "number" ||
    (status !== "idle" &&
      status !== "awaiting_reply" &&
      status !== "completed" &&
      status !== "failed")
  ) {
    return null;
  }
  return {
    _id: payload._id,
    flowId: payload.flowId,
    contactId: payload.contactId,
    currentNodeId: payload.currentNodeId,
    status,
    stepCount: payload.stepCount,
    lastOutboundMessageId:
      typeof payload.lastOutboundMessageId === "string"
        ? payload.lastOutboundMessageId
        : null,
  };
}

export function parseMessageFlowRuns(payload: unknown): MessageFlowRun[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  return payload
    .map(parseMessageFlowRun)
    .filter((run): run is MessageFlowRun => run !== null);
}

export function createFlowEntityId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyFlowDraft(name = "Nuevo flujo"): FlowUpsertBody {
  const startId = createFlowEntityId("node");
  return {
    name,
    active: true,
    startNodeId: startId,
    nodes: [
      {
        id: startId,
        title: "Mensaje inicial",
        body: "(editar mensaje)",
        position: { x: 40, y: 40 },
      },
    ],
    edges: [],
  };
}

/** BFF / UI validation before proxying an upsert to Core. */
export function validateFlowUpsertBody(body: unknown): FlowUpsertBody | null {
  if (!isRecord(body)) {
    return null;
  }
  if (
    typeof body.name !== "string" ||
    !body.name.trim() ||
    typeof body.startNodeId !== "string" ||
    !body.startNodeId.trim() ||
    !Array.isArray(body.nodes) ||
    !Array.isArray(body.edges)
  ) {
    return null;
  }

  const nodes = body.nodes
    .map(parseNode)
    .filter((node): node is MessageFlowNode => node !== null);
  const edges = body.edges
    .map(parseEdge)
    .filter((edge): edge is MessageFlowEdge => edge !== null);

  if (nodes.length === 0 || nodes.length !== body.nodes.length) {
    return null;
  }
  if (edges.length !== body.edges.length) {
    return null;
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  if (!nodeIds.has(body.startNodeId.trim())) {
    return null;
  }
  for (const edge of edges) {
    if (!nodeIds.has(edge.fromNodeId) || !nodeIds.has(edge.toNodeId)) {
      return null;
    }
    if (!edge.match.value.trim()) {
      return null;
    }
  }
  for (const node of nodes) {
    if (!node.title.trim() || !node.body.trim()) {
      return null;
    }
  }

  return {
    name: body.name.trim(),
    active: body.active === undefined ? true : body.active !== false,
    startNodeId: body.startNodeId.trim(),
    nodes,
    edges,
  };
}
