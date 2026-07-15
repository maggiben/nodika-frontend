"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  createFlowEntityId,
  emptyFlowDraft,
  parseMessageFlow,
  parseMessageFlows,
  type FlowMatchType,
  type MessageFlow,
  type MessageFlowEdge,
  type MessageFlowNode,
  validateFlowUpsertBody,
} from "@/lib/staff-message-flow";
import {
  applyCatalogMessagePreset,
  CATALOG_MESSAGE_PRESET_IDS,
  type CatalogMessagePresetId,
} from "@/lib/staff-org-chart-draft";
import { readOrgChart } from "@/lib/staff-org-chart";
import { parseStaffRoster, type StaffRosterRow } from "@/lib/staff-roster";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 96;

type DraftFlow = {
  _id: string | null;
  name: string;
  active: boolean;
  startNodeId: string;
  nodes: MessageFlowNode[];
  edges: MessageFlowEdge[];
};

function toDraft(flow: MessageFlow): DraftFlow {
  return {
    _id: flow._id,
    name: flow.name,
    active: flow.active,
    startNodeId: flow.startNodeId,
    nodes: flow.nodes.map((node) => ({
      ...node,
      position: { ...node.position },
    })),
    edges: flow.edges.map((edge) => ({
      ...edge,
      match: { ...edge.match },
    })),
  };
}

function nodeCenter(node: MessageFlowNode) {
  return {
    x: node.position.x + NODE_WIDTH / 2,
    y: node.position.y + NODE_HEIGHT / 2,
  };
}

export function StaffMessageFlowEditor() {
  const { locale, t } = useDictionary();
  const [flows, setFlows] = useState<MessageFlow[]>([]);
  const [roster, setRoster] = useState<StaffRosterRow[]>([]);
  const [draft, setDraft] = useState<DraftFlow | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);
  const [startContactId, setStartContactId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drag, setDrag] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const selectedNode = useMemo(
    () => draft?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [draft, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => draft?.edges.find((edge) => edge.id === selectedEdgeId) ?? null,
    [draft, selectedEdgeId],
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [flowsResponse, rosterResponse] = await Promise.all([
          fetch("/api/messaging/flows", { cache: "no-store" }),
          fetch("/api/messaging/roster", { cache: "no-store" }),
        ]);
        const flowsBody: unknown = await flowsResponse.json().catch(() => null);
        const rosterBody: unknown = await rosterResponse
          .json()
          .catch(() => null);
        if (cancelled) {
          return;
        }
        if (!flowsResponse.ok) {
          throw new Error(
            typeof (flowsBody as { message?: string })?.message === "string"
              ? (flowsBody as { message: string }).message
              : t("staff.flow.loadError"),
          );
        }
        const parsedFlows = parseMessageFlows(flowsBody);
        setFlows(parsedFlows);
        setRoster(rosterResponse.ok ? parseStaffRoster(rosterBody) : []);
        setDraft((current) => {
          if (current?._id) {
            const match = parsedFlows.find((flow) => flow._id === current._id);
            return match ? toDraft(match) : current;
          }
          return current;
        });
        setError(null);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("staff.flow.loadError"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const updateDraft = useCallback((updater: (prev: DraftFlow) => DraftFlow) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
    setMessage(null);
  }, []);

  async function createFlow() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const body = emptyFlowDraft(t("staff.flow.newName"));
      body.nodes[0].title = t("staff.flow.nodeTitle");
      body.nodes[0].body = t("staff.flow.nodeBodyPlaceholder");
      const response = await fetch("/api/messaging/flows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof (payload as { message?: string })?.message === "string"
            ? (payload as { message: string }).message
            : t("staff.flow.saveError"),
        );
      }
      const created = parseMessageFlow(payload);
      if (!created) {
        throw new Error(t("staff.flow.saveError"));
      }
      setFlows((prev) => [created, ...prev]);
      setDraft(toDraft(created));
      setSelectedNodeId(created.startNodeId);
      setSelectedEdgeId(null);
      setMessage(t("staff.flow.saved"));
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : t("staff.flow.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveFlow() {
    if (!draft?._id) {
      return;
    }
    const validated = validateFlowUpsertBody({
      name: draft.name,
      active: draft.active,
      startNodeId: draft.startNodeId,
      nodes: draft.nodes,
      edges: draft.edges,
    });
    if (!validated) {
      setError(t("staff.flow.invalid"));
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/messaging/flows/${encodeURIComponent(draft._id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validated),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          typeof (payload as { message?: string })?.message === "string"
            ? (payload as { message: string }).message
            : t("staff.flow.saveError"),
        );
      }
      const saved = parseMessageFlow(payload);
      if (!saved) {
        throw new Error(t("staff.flow.saveError"));
      }
      setFlows((prev) =>
        prev.map((flow) => (flow._id === saved._id ? saved : flow)),
      );
      setDraft(toDraft(saved));
      setMessage(t("staff.flow.saved"));
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : t("staff.flow.saveError"),
      );
    } finally {
      setSaving(false);
    }
  }

  async function startFlow() {
    if (!draft?._id || !startContactId) {
      setError(t("staff.flow.startContactRequired"));
      return;
    }
    setStarting(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/messaging/flows/${encodeURIComponent(draft._id)}/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId: startContactId }),
        },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 409) {
        throw new Error(t("staff.flow.startConflict"));
      }
      if (!response.ok) {
        throw new Error(
          typeof (payload as { message?: string })?.message === "string"
            ? (payload as { message: string }).message
            : t("staff.flow.startError"),
        );
      }
      setMessage(t("staff.flow.started"));
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : t("staff.flow.startError"),
      );
    } finally {
      setStarting(false);
    }
  }

  function addNode() {
    if (!draft) {
      return;
    }
    const id = createFlowEntityId("node");
    const index = draft.nodes.length;
    updateDraft((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        {
          id,
          title: t("staff.flow.nodeTitle"),
          body: t("staff.flow.nodeBodyPlaceholder"),
          position: { x: 40 + index * 28, y: 40 + index * 28 },
        },
      ],
    }));
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }

  function addNodeFromPreset(presetId: CatalogMessagePresetId) {
    if (!draft) {
      return;
    }
    const lead = roster.find((row) => row._id === startContactId);
    const leadName = lead?.label?.trim() || lead?.phone || "";
    const chart = startContactId ? readOrgChart(startContactId) : null;
    const applied = applyCatalogMessagePreset({
      presetId,
      locale,
      leadName,
      chart,
    });
    const id = createFlowEntityId("node");
    const index = draft.nodes.length;
    updateDraft((prev) => ({
      ...prev,
      nodes: [
        ...prev.nodes,
        {
          id,
          title: applied.title,
          body: applied.body,
          position: { x: 40 + index * 36, y: 40 + index * 36 },
        },
      ],
    }));
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
    setMessage(
      applied.usedOrgChart
        ? t("staff.flow.presetNodeApplied")
        : t("staff.flow.presetNodePlaceholder"),
    );
  }

  function beginConnect(nodeId: string) {
    if (!draft) {
      return;
    }
    if (!connectFromId) {
      setConnectFromId(nodeId);
      setMessage(t("staff.flow.connectHint"));
      return;
    }
    if (connectFromId === nodeId) {
      setConnectFromId(null);
      return;
    }
    const edgeId = createFlowEntityId("edge");
    updateDraft((prev) => ({
      ...prev,
      edges: [
        ...prev.edges,
        {
          id: edgeId,
          fromNodeId: connectFromId,
          toNodeId: nodeId,
          match: { type: "contains", value: "ok" },
        },
      ],
    }));
    setConnectFromId(null);
    setSelectedEdgeId(edgeId);
    setSelectedNodeId(null);
    setMessage(t("staff.flow.edgeAdded"));
  }

  function onCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!drag || !draft) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - drag.offsetX;
    const y = event.clientY - rect.top - drag.offsetY;
    updateDraft((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === drag.nodeId
          ? {
              ...node,
              position: {
                x: Math.max(0, x),
                y: Math.max(0, y),
              },
            }
          : node,
      ),
    }));
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography component="h1" variant="h5">
              {t("staff.flow.title")}
            </Typography>
            <Typography color="text.secondary">
              {t("staff.flow.description")}
            </Typography>
          </Box>
          <Button component={Link} href={`/${locale}/staff`} variant="outlined">
            {t("staff.flow.backToRoster")}
          </Button>
        </Stack>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {message ? <Alert severity="success">{message}</Alert> : null}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Paper sx={{ p: 2, width: { md: 280 }, flexShrink: 0 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1">
                {t("staff.flow.listTitle")}
              </Typography>
              <Button
                disabled={saving || loading}
                onClick={() => void createFlow()}
                variant="contained"
              >
                {t("staff.flow.create")}
              </Button>
              {flows.length === 0 && !loading ? (
                <Typography color="text.secondary" variant="body2">
                  {t("staff.flow.empty")}
                </Typography>
              ) : null}
              {flows.map((flow) => (
                <Button
                  key={flow._id}
                  onClick={() => {
                    setDraft(toDraft(flow));
                    setSelectedNodeId(flow.startNodeId);
                    setSelectedEdgeId(null);
                    setMessage(null);
                    setError(null);
                  }}
                  sx={{ justifyContent: "flex-start" }}
                  variant={draft?._id === flow._id ? "contained" : "outlined"}
                >
                  {flow.name}
                </Button>
              ))}
            </Stack>
          </Paper>

          <Paper sx={{ p: 2, flex: 1, minWidth: 0 }}>
            {!draft ? (
              <Typography color="text.secondary">
                {t("staff.flow.selectOrCreate")}
              </Typography>
            ) : (
              <Stack spacing={2}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  useFlexGap
                >
                  <TextField
                    fullWidth
                    label={t("staff.flow.name")}
                    onChange={(event) =>
                      updateDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    value={draft.name}
                  />
                  <Button
                    disabled={saving}
                    onClick={() => void saveFlow()}
                    variant="contained"
                  >
                    {saving ? t("staff.saving") : t("staff.flow.save")}
                  </Button>
                  <Button onClick={addNode} variant="outlined">
                    {t("staff.flow.addNode")}
                  </Button>
                  <FormControl sx={{ minWidth: 220 }} size="small">
                    <InputLabel id="flow-preset-node">
                      {t("staff.flow.addPresetNode")}
                    </InputLabel>
                    <Select
                      displayEmpty
                      label={t("staff.flow.addPresetNode")}
                      labelId="flow-preset-node"
                      onChange={(event) => {
                        const value = String(event.target.value);
                        if (
                          CATALOG_MESSAGE_PRESET_IDS.includes(
                            value as CatalogMessagePresetId,
                          )
                        ) {
                          addNodeFromPreset(value as CatalogMessagePresetId);
                        }
                      }}
                      value=""
                    >
                      <MenuItem disabled value="">
                        <em>{t("staff.flow.addPresetNodeChoose")}</em>
                      </MenuItem>
                      {CATALOG_MESSAGE_PRESET_IDS.map((id) => (
                        <MenuItem key={id} value={id}>
                          {t(`staff.catalogPresets.${id}`)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>

                <Typography color="text.secondary" variant="body2">
                  {t("staff.flow.chainHint")}
                </Typography>

                <Box
                  onPointerLeave={() => setDrag(null)}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={() => setDrag(null)}
                  sx={{
                    position: "relative",
                    height: 420,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "action.hover",
                    overflow: "auto",
                    touchAction: "none",
                  }}
                >
                  <svg
                    height="100%"
                    style={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                    }}
                    width="100%"
                  >
                    {draft.edges.map((edge) => {
                      const from = draft.nodes.find(
                        (node) => node.id === edge.fromNodeId,
                      );
                      const to = draft.nodes.find(
                        (node) => node.id === edge.toNodeId,
                      );
                      if (!from || !to) {
                        return null;
                      }
                      const a = nodeCenter(from);
                      const b = nodeCenter(to);
                      return (
                        <g key={edge.id}>
                          <line
                            markerEnd="url(#arrow)"
                            stroke={
                              selectedEdgeId === edge.id ? "#1565c0" : "#616161"
                            }
                            strokeWidth={selectedEdgeId === edge.id ? 2.5 : 1.5}
                            x1={a.x}
                            x2={b.x}
                            y1={a.y}
                            y2={b.y}
                          />
                          <text
                            fill="#424242"
                            fontSize="11"
                            x={(a.x + b.x) / 2}
                            y={(a.y + b.y) / 2 - 6}
                          >
                            {edge.match.type}:{edge.match.value}
                          </text>
                        </g>
                      );
                    })}
                    <defs>
                      <marker
                        id="arrow"
                        markerHeight="7"
                        markerWidth="7"
                        orient="auto"
                        refX="10"
                        refY="3.5"
                      >
                        <polygon fill="#616161" points="0 0, 10 3.5, 0 7" />
                      </marker>
                    </defs>
                  </svg>

                  {draft.nodes.map((node) => (
                    <Paper
                      key={node.id}
                      elevation={selectedNodeId === node.id ? 6 : 2}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                      }}
                      onPointerDown={(event) => {
                        const target = event.currentTarget;
                        const rect =
                          target.parentElement?.getBoundingClientRect();
                        if (!rect) {
                          return;
                        }
                        setDrag({
                          nodeId: node.id,
                          offsetX: event.clientX - rect.left - node.position.x,
                          offsetY: event.clientY - rect.top - node.position.y,
                        });
                        setSelectedNodeId(node.id);
                        setSelectedEdgeId(null);
                      }}
                      sx={{
                        position: "absolute",
                        left: node.position.x,
                        top: node.position.y,
                        width: NODE_WIDTH,
                        minHeight: NODE_HEIGHT,
                        p: 1.25,
                        cursor: "grab",
                        border:
                          draft.startNodeId === node.id
                            ? "2px solid"
                            : "1px solid",
                        borderColor:
                          draft.startNodeId === node.id
                            ? "primary.main"
                            : "divider",
                        outline:
                          connectFromId === node.id
                            ? "2px dashed #ed6c02"
                            : undefined,
                      }}
                    >
                      <Typography noWrap variant="subtitle2">
                        {node.title}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        variant="caption"
                      >
                        {node.body}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            beginConnect(node.id);
                          }}
                          size="small"
                        >
                          {t("staff.flow.connect")}
                        </Button>
                        <Button
                          onClick={(event) => {
                            event.stopPropagation();
                            updateDraft((prev) => ({
                              ...prev,
                              startNodeId: node.id,
                            }));
                          }}
                          size="small"
                        >
                          {t("staff.flow.setStart")}
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
                </Box>

                {selectedNode ? (
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1">
                      {t("staff.flow.editNode")}
                    </Typography>
                    <TextField
                      label={t("staff.flow.nodeTitle")}
                      onChange={(event) =>
                        updateDraft((prev) => ({
                          ...prev,
                          nodes: prev.nodes.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, title: event.target.value }
                              : node,
                          ),
                        }))
                      }
                      value={selectedNode.title}
                    />
                    <TextField
                      label={t("staff.flow.nodeBody")}
                      minRows={3}
                      multiline
                      onChange={(event) =>
                        updateDraft((prev) => ({
                          ...prev,
                          nodes: prev.nodes.map((node) =>
                            node.id === selectedNode.id
                              ? { ...node, body: event.target.value }
                              : node,
                          ),
                        }))
                      }
                      value={selectedNode.body}
                    />
                    <Button
                      color="error"
                      disabled={draft.nodes.length <= 1}
                      onClick={() => {
                        updateDraft((prev) => {
                          const nodes = prev.nodes.filter(
                            (node) => node.id !== selectedNode.id,
                          );
                          const edges = prev.edges.filter(
                            (edge) =>
                              edge.fromNodeId !== selectedNode.id &&
                              edge.toNodeId !== selectedNode.id,
                          );
                          const startNodeId =
                            prev.startNodeId === selectedNode.id
                              ? (nodes[0]?.id ?? prev.startNodeId)
                              : prev.startNodeId;
                          return { ...prev, nodes, edges, startNodeId };
                        });
                        setSelectedNodeId(null);
                      }}
                      variant="outlined"
                    >
                      {t("staff.flow.deleteNode")}
                    </Button>
                  </Stack>
                ) : null}

                <Stack spacing={1}>
                  <Typography variant="subtitle1">
                    {t("staff.flow.edgesTitle")}
                  </Typography>
                  {draft.edges.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      {t("staff.flow.noEdges")}
                    </Typography>
                  ) : null}
                  {draft.edges.map((edge) => (
                    <Button
                      key={edge.id}
                      onClick={() => {
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                      sx={{ justifyContent: "flex-start" }}
                      variant={
                        selectedEdgeId === edge.id ? "contained" : "text"
                      }
                    >
                      {edge.fromNodeId} → {edge.toNodeId} ({edge.match.type}:{" "}
                      {edge.match.value})
                    </Button>
                  ))}
                </Stack>

                {selectedEdge ? (
                  <Stack spacing={1.5}>
                    <Typography variant="subtitle1">
                      {t("staff.flow.editEdge")}
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="match-type">
                        {t("staff.flow.matchType")}
                      </InputLabel>
                      <Select
                        label={t("staff.flow.matchType")}
                        labelId="match-type"
                        onChange={(event) =>
                          updateDraft((prev) => ({
                            ...prev,
                            edges: prev.edges.map((edge) =>
                              edge.id === selectedEdge.id
                                ? {
                                    ...edge,
                                    match: {
                                      ...edge.match,
                                      type: event.target.value as FlowMatchType,
                                    },
                                  }
                                : edge,
                            ),
                          }))
                        }
                        value={selectedEdge.match.type}
                      >
                        <MenuItem value="equals">
                          {t("staff.flow.matchEquals")}
                        </MenuItem>
                        <MenuItem value="contains">
                          {t("staff.flow.matchContains")}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <TextField
                      label={t("staff.flow.matchValue")}
                      onChange={(event) =>
                        updateDraft((prev) => ({
                          ...prev,
                          edges: prev.edges.map((edge) =>
                            edge.id === selectedEdge.id
                              ? {
                                  ...edge,
                                  match: {
                                    ...edge.match,
                                    value: event.target.value,
                                  },
                                }
                              : edge,
                          ),
                        }))
                      }
                      value={selectedEdge.match.value}
                    />
                    <Button
                      color="error"
                      onClick={() => {
                        updateDraft((prev) => ({
                          ...prev,
                          edges: prev.edges.filter(
                            (edge) => edge.id !== selectedEdge.id,
                          ),
                        }));
                        setSelectedEdgeId(null);
                      }}
                      variant="outlined"
                    >
                      {t("staff.flow.deleteEdge")}
                    </Button>
                  </Stack>
                ) : null}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ pt: 1 }}
                >
                  <FormControl fullWidth>
                    <InputLabel id="start-contact">
                      {t("staff.flow.startContact")}
                    </InputLabel>
                    <Select
                      label={t("staff.flow.startContact")}
                      labelId="start-contact"
                      onChange={(event) =>
                        setStartContactId(String(event.target.value))
                      }
                      value={startContactId}
                    >
                      {roster.map((row) => (
                        <MenuItem key={row._id} value={row._id}>
                          {row.label || row.phone}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    disabled={starting || !draft._id}
                    onClick={() => void startFlow()}
                    variant="contained"
                  >
                    {starting ? t("staff.saving") : t("staff.flow.start")}
                  </Button>
                </Stack>
              </Stack>
            )}
          </Paper>
        </Stack>
      </Stack>
    </Container>
  );
}
