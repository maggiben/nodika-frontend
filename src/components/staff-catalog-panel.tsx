"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { useVisibleInterval } from "@/hooks/use-visible-interval";
import {
  groupCatalogByLead,
  moveIdInOrder,
  parseStaffCatalog,
  type StaffCatalogRow,
} from "@/lib/staff-catalog";
import {
  applyCatalogMessagePreset,
  CATALOG_MESSAGE_PRESET_IDS,
  type CatalogMessagePresetId,
} from "@/lib/staff-org-chart-draft";
import { readOrgChart } from "@/lib/staff-org-chart";
import type { StaffRosterRow } from "@/lib/staff-roster";
import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
  type StaffResponseStatus,
} from "@/lib/staff-response-status";
import { truncateForPreview } from "@/lib/text-preview";

const STATUS_COLOR: Record<string, string> = {
  green: "#2e7d32",
  yellow: "#ed6c02",
  red: "#d32f2f",
  pending: "#ed6c02",
  neutral: "#9e9e9e",
};

function formatLatency(ms: number | null): string {
  if (ms === null) {
    return "—";
  }
  const hours = ms / (60 * 60 * 1000);
  if (hours < 48) {
    return `${Math.round(hours)}h`;
  }
  return `${Math.round(hours / 24)}d`;
}

function leadInitial(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return "?";
  }
  return trimmed.slice(0, 1).toUpperCase();
}

export function StaffCatalogPanel({
  roster,
}: Readonly<{ roster: StaffRosterRow[] }>) {
  const { locale, t } = useDictionary();
  const [rows, setRows] = useState<StaffCatalogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [assignContactId, setAssignContactId] = useState("");
  const [presetId, setPresetId] = useState<"" | CatalogMessagePresetId>("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragCatalogId, setDragCatalogId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  /** Pointer DnD session (HTML5 drag is unreliable with React re-renders). */
  const dragSessionRef = useRef<{
    catalogId: string;
    contactId: string;
    pointerId: number;
  } | null>(null);

  const leadGroups = useMemo(() => groupCatalogByLead(rows), [rows]);

  const clearDragState = useCallback(() => {
    dragSessionRef.current = null;
    setDragCatalogId(null);
    setDragOverId(null);
  }, []);

  const cardAtPoint = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const card =
      el instanceof Element ? el.closest("[data-catalog-card]") : null;
    if (!(card instanceof HTMLElement)) {
      return null;
    }
    const catalogId = card.dataset.catalogId?.trim() ?? "";
    const contactId = card.dataset.contactId?.trim() ?? "";
    if (!catalogId || !contactId) {
      return null;
    }
    return { catalogId, contactId };
  }, []);

  const loadCatalog = useCallback(async () => {
    const response = await fetch("/api/messaging/catalog", {
      cache: "no-store",
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        typeof payload === "object" &&
          payload !== null &&
          "message" in payload &&
          typeof payload.message === "string"
          ? payload.message
          : t("staff.catalogLoadError"),
      );
    }
    return parseStaffCatalog(payload);
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await loadCatalog();
        if (!cancelled) {
          setRows(next);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("staff.unreachable"),
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadCatalog, t]);

  const refreshCatalogQuietly = useCallback(async () => {
    try {
      const next = await loadCatalog();
      setRows(next);
    } catch {
      // Keep the last good catalog during background polls.
    }
  }, [loadCatalog]);

  useVisibleInterval(() => {
    // Don't clobber an in-progress drag with a background refresh.
    if (dragSessionRef.current) {
      return;
    }
    void refreshCatalogQuietly();
  }, 4_000);

  function applyPreset(
    nextPreset: CatalogMessagePresetId,
    contactId = assignContactId,
  ) {
    const lead = roster.find((row) => row._id === contactId);
    const leadName = lead?.label?.trim() || lead?.phone || "";
    const chart = contactId ? readOrgChart(contactId) : null;
    const applied = applyCatalogMessagePreset({
      presetId: nextPreset,
      locale,
      leadName,
      chart,
    });
    setTitle(applied.title);
    setBody(applied.body);
    setPresetId(nextPreset);
    setMessage(
      applied.usedOrgChart
        ? t("staff.catalogPresetApplied")
        : t("staff.catalogPresetPlaceholder"),
    );
    setError(null);
  }

  async function saveCatalogMessage() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/messaging/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body,
          assignedContactId: assignContactId || undefined,
          active: true,
        }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
            ? payload.message
            : t("staff.catalogSaveError"),
        );
        return;
      }
      setTitle("");
      setBody("");
      setAssignContactId("");
      setPresetId("");
      setMessage(t("staff.catalogSaved"));
      setRows(await loadCatalog());
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setSaving(false);
    }
  }

  const assignRow = useCallback(
    async (row: StaffCatalogRow, contactId: string) => {
      setBusyId(row._id);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/messaging/catalog/${encodeURIComponent(row._id)}/assign`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contactId }),
          },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
              ? payload.message
              : t("staff.catalogAssignError"),
          );
          return;
        }
        setMessage(t("staff.catalogAssigned"));
        setRows(await loadCatalog());
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyId(null);
      }
    },
    [loadCatalog, t],
  );

  const sendRow = useCallback(
    async (row: StaffCatalogRow) => {
      setBusyId(row._id);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/messaging/catalog/${encodeURIComponent(row._id)}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              row.assignedContactId ? { contactId: row.assignedContactId } : {},
            ),
          },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
              ? payload.message
              : t("staff.catalogSendError"),
          );
          return;
        }
        setMessage(t("staff.catalogSent"));
        setRows(await loadCatalog());
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyId(null);
      }
    },
    [loadCatalog, t],
  );

  const deleteRow = useCallback(
    async (row: StaffCatalogRow) => {
      setBusyId(row._id);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch(
          `/api/messaging/catalog/${encodeURIComponent(row._id)}`,
          { method: "DELETE" },
        );
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
              ? payload.message
              : t("staff.catalogDeleteError"),
          );
          return;
        }
        setMessage(t("staff.catalogDeleted"));
        setRows(await loadCatalog());
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyId(null);
      }
    },
    [loadCatalog, t],
  );

  const reorderLead = useCallback(
    async (contactId: string, fromId: string, toId: string) => {
      const group = leadGroups.find((item) => item.contactId === contactId);
      if (!group) {
        clearDragState();
        return;
      }
      const nextIds = moveIdInOrder(
        group.rows.map((row) => row._id),
        fromId,
        toId,
      );
      if (!nextIds) {
        clearDragState();
        return;
      }

      // Optimistic local reorder so the grid updates immediately.
      setRows((prev) => {
        const byId = new Map(prev.map((row) => [row._id, row]));
        const reordered = nextIds
          .map((id, index) => {
            const row = byId.get(id);
            return row ? { ...row, sortOrder: index + 1 } : null;
          })
          .filter((row): row is StaffCatalogRow => row !== null);
        const untouched = prev.filter(
          (row) => row.assignedContactId !== contactId,
        );
        return [...untouched, ...reordered];
      });
      clearDragState();
      setBusyId(fromId);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch("/api/messaging/catalog/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId, orderedIds: nextIds }),
        });
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof payload === "object" &&
              payload !== null &&
              "message" in payload &&
              typeof payload.message === "string"
              ? payload.message
              : t("staff.catalogReorderError"),
          );
          setRows(await loadCatalog());
          return;
        }
        setRows(parseStaffCatalog(payload));
        setMessage(t("staff.catalogReordered"));
      } catch {
        setError(t("staff.unreachable"));
        try {
          setRows(await loadCatalog());
        } catch {
          // Keep optimistic order if reload also fails.
        }
      } finally {
        setBusyId(null);
        clearDragState();
      }
    },
    [clearDragState, leadGroups, loadCatalog, t],
  );

  const isDragging = Boolean(dragCatalogId);

  return (
    <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
      <Typography component="h2" variant="h6">
        {t("staff.catalogTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5, mt: 0.25 }} variant="body2">
        {t("staff.catalogDescription")}
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 1.5 }}>
          {message}
        </Alert>
      ) : null}

      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(220px, 260px) minmax(0, 1fr)",
          },
        }}
      >
        <Paper
          variant="outlined"
          sx={{
            bgcolor: "action.hover",
            p: 1.25,
            position: { md: "sticky" },
            top: { md: 12 },
            width: "100%",
          }}
        >
          <Typography sx={{ mb: 1 }} variant="subtitle2">
            {t("staff.catalogSave")}
          </Typography>
          <Stack spacing={1}>
            <FormControl fullWidth size="small">
              <InputLabel id="catalog-preset">
                {t("staff.catalogPresetLabel")}
              </InputLabel>
              <Select
                label={t("staff.catalogPresetLabel")}
                labelId="catalog-preset"
                onChange={(event) => {
                  const value = String(event.target.value);
                  if (
                    CATALOG_MESSAGE_PRESET_IDS.includes(
                      value as CatalogMessagePresetId,
                    )
                  ) {
                    applyPreset(value as CatalogMessagePresetId);
                  } else {
                    setPresetId("");
                    setTitle("");
                    setBody("");
                    setMessage(null);
                  }
                }}
                value={presetId}
              >
                <MenuItem value="">
                  <em>{t("staff.catalogPresetChoose")}</em>
                </MenuItem>
                {CATALOG_MESSAGE_PRESET_IDS.map((id) => (
                  <MenuItem key={id} value={id}>
                    {t(`staff.catalogPresets.${id}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel id="catalog-assign-new">
                {t("staff.catalogAssignPlaceholder")}
              </InputLabel>
              <Select
                label={t("staff.catalogAssignPlaceholder")}
                labelId="catalog-assign-new"
                onChange={(event) => {
                  const nextContactId = String(event.target.value);
                  setAssignContactId(nextContactId);
                  if (presetId) {
                    applyPreset(presetId, nextContactId);
                  }
                }}
                value={assignContactId}
              >
                <MenuItem value="">
                  <em>{t("staff.catalogAssignLater")}</em>
                </MenuItem>
                {roster.map((contact) => (
                  <MenuItem key={contact._id} value={contact._id}>
                    {contact.label || contact.phone}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label={t("staff.catalogMessageTitle")}
              onChange={(event) => {
                setTitle(event.target.value);
                if (presetId) {
                  setPresetId("");
                }
              }}
              size="small"
              value={title}
            />
            <TextField
              label={t("staff.catalogMessageBody")}
              minRows={4}
              multiline
              onChange={(event) => {
                setBody(event.target.value);
                if (presetId) {
                  setPresetId("");
                }
              }}
              size="small"
              value={body}
            />
            <Button
              disabled={
                saving || title.trim().length === 0 || body.trim().length === 0
              }
              fullWidth
              onClick={() => void saveCatalogMessage()}
              size="small"
              variant="contained"
            >
              {saving ? t("staff.saving") : t("staff.catalogSave")}
            </Button>
          </Stack>
        </Paper>

        {rows.length === 0 ? (
          <Box
            sx={{
              alignItems: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              display: "flex",
              justifyContent: "center",
              minHeight: 100,
              p: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {t("staff.catalogEmpty")}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2} sx={{ minWidth: 0 }}>
            {leadGroups.map((group) => {
              const canReorder = Boolean(group.contactId);
              return (
                <Box key={group.contactId ?? "unassigned"}>
                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{
                    alignItems: "center",
                    bgcolor: group.contactId
                      ? "primary.main"
                      : "action.selected",
                    borderRadius: 1.5,
                    color: group.contactId
                      ? "primary.contrastText"
                      : "text.primary",
                    mb: 1,
                    px: 1.25,
                    py: 0.85,
                  }}
                >
                  <Box
                    aria-hidden
                    sx={{
                      alignItems: "center",
                      bgcolor: group.contactId
                        ? "rgba(255,255,255,0.22)"
                        : "background.paper",
                      borderRadius: "50%",
                      display: "inline-flex",
                      fontWeight: 700,
                      height: 32,
                      justifyContent: "center",
                      typography: "subtitle2",
                      width: 32,
                    }}
                  >
                    {leadInitial(group.label)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }} variant="subtitle2">
                      {group.contactId
                        ? t("staff.catalogLeadGroup", { name: group.label })
                        : t("staff.catalogUnassignedGroup")}
                    </Typography>
                    <Typography
                      noWrap
                      sx={{
                        opacity: 0.9,
                        typography: "caption",
                      }}
                    >
                      {canReorder
                        ? t("staff.catalogOrderHint")
                        : t("staff.catalogUnassignedHint")}
                    </Typography>
                  </Box>
                  <Chip
                    label={t("staff.catalogLeadCount", {
                      n: group.rows.length,
                    })}
                    size="small"
                    sx={{
                      bgcolor: group.contactId
                        ? "rgba(255,255,255,0.2)"
                        : "background.paper",
                      color: "inherit",
                      fontWeight: 600,
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                >
                  {group.rows.map((row) => {
                    const busy = busyId === row._id;
                    const status = (
                      [
                        "green",
                        "yellow",
                        "red",
                        "neutral",
                        "pending",
                      ].includes(row.responseStatus)
                        ? row.responseStatus
                        : computeStaffResponseStatus(
                            row.lastSentAt,
                            row.repliedAt,
                          )
                    ) as StaffResponseStatus;
                    const statusLabel = t(`staff.status.${status}`);
                    const order =
                      group.contactId && row.sortOrder > 0
                        ? row.sortOrder
                        : null;
                    const isSource = dragCatalogId === row._id;
                    const isDropTarget =
                      dragOverId === row._id &&
                      dragCatalogId !== null &&
                      dragCatalogId !== row._id;

                    return (
                      <Box
                        key={row._id}
                        data-catalog-card=""
                        data-catalog-id={row._id}
                        data-contact-id={group.contactId ?? ""}
                        sx={{
                          bgcolor: isDropTarget
                            ? "action.selected"
                            : "background.paper",
                          border: "1px solid",
                          borderColor: isDropTarget
                            ? "primary.main"
                            : isSource
                              ? "primary.light"
                              : "divider",
                          borderRadius: 1,
                          boxShadow: isDropTarget ? 2 : 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.75,
                          minHeight: 0,
                          opacity: isSource ? 0.45 : 1,
                          outline: isDropTarget
                            ? "2px solid"
                            : undefined,
                          outlineColor: isDropTarget
                            ? "primary.main"
                            : undefined,
                          p: 1,
                          // Let elementFromPoint hit sibling cards under the dragged one.
                          pointerEvents: isSource ? "none" : "auto",
                          position: "relative",
                          transition: "border-color 120ms, box-shadow 120ms",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={0.75}
                          sx={{ alignItems: "center" }}
                        >
                          {canReorder && group.contactId ? (
                            <Box
                              aria-label={t("staff.catalogDragHandle")}
                              onPointerCancel={() => {
                                clearDragState();
                              }}
                              onPointerDown={(event) => {
                                if (event.button !== 0 || busy) {
                                  return;
                                }
                                event.preventDefault();
                                event.stopPropagation();
                                const contactId = group.contactId;
                                if (!contactId) {
                                  return;
                                }
                                event.currentTarget.setPointerCapture(
                                  event.pointerId,
                                );
                                dragSessionRef.current = {
                                  catalogId: row._id,
                                  contactId,
                                  pointerId: event.pointerId,
                                };
                                setDragCatalogId(row._id);
                                setDragOverId(null);
                              }}
                              onPointerMove={(event) => {
                                const session = dragSessionRef.current;
                                if (
                                  !session ||
                                  session.pointerId !== event.pointerId
                                ) {
                                  return;
                                }
                                const hit = cardAtPoint(
                                  event.clientX,
                                  event.clientY,
                                );
                                if (
                                  !hit ||
                                  hit.contactId !== session.contactId ||
                                  hit.catalogId === session.catalogId
                                ) {
                                  if (dragOverId !== null) {
                                    setDragOverId(null);
                                  }
                                  return;
                                }
                                if (dragOverId !== hit.catalogId) {
                                  setDragOverId(hit.catalogId);
                                }
                              }}
                              onPointerUp={(event) => {
                                const session = dragSessionRef.current;
                                if (
                                  !session ||
                                  session.pointerId !== event.pointerId
                                ) {
                                  return;
                                }
                                try {
                                  event.currentTarget.releasePointerCapture(
                                    event.pointerId,
                                  );
                                } catch {
                                  // Capture may already be released.
                                }
                                const hit = cardAtPoint(
                                  event.clientX,
                                  event.clientY,
                                );
                                if (
                                  hit &&
                                  hit.contactId === session.contactId &&
                                  hit.catalogId !== session.catalogId
                                ) {
                                  void reorderLead(
                                    session.contactId,
                                    session.catalogId,
                                    hit.catalogId,
                                  );
                                  return;
                                }
                                clearDragState();
                              }}
                              role="button"
                              tabIndex={0}
                              title={t("staff.catalogDragHandle")}
                              sx={{
                                alignItems: "center",
                                bgcolor: "action.hover",
                                borderRadius: 0.75,
                                color: "text.secondary",
                                cursor: isSource ? "grabbing" : "grab",
                                display: "inline-flex",
                                flexShrink: 0,
                                fontSize: 14,
                                height: 28,
                                justifyContent: "center",
                                letterSpacing: "-1px",
                                lineHeight: 1,
                                // Keep receiving captured pointer events while the card ignores hits.
                                pointerEvents: "auto",
                                touchAction: "none",
                                userSelect: "none",
                                width: 22,
                              }}
                            >
                              ⋮⋮
                            </Box>
                          ) : null}
                          {order !== null ? (
                            <Box
                              aria-label={t("staff.catalogOrderBadge", {
                                n: order,
                              })}
                              sx={{
                                bgcolor: "primary.main",
                                borderRadius: "50%",
                                color: "primary.contrastText",
                                display: "inline-flex",
                                flexShrink: 0,
                                fontWeight: 700,
                                height: 24,
                                alignItems: "center",
                                justifyContent: "center",
                                minWidth: 24,
                                typography: "caption",
                              }}
                            >
                              {order}
                            </Box>
                          ) : null}
                          <Typography
                            noWrap
                            sx={{ flex: 1, fontWeight: 600 }}
                            title={row.title}
                            variant="subtitle2"
                          >
                            {row.title}
                          </Typography>
                          <Tooltip title={statusLabel}>
                            <IconButton
                              aria-label={statusLabel}
                              size="small"
                              sx={{
                                color:
                                  STATUS_COLOR[status] ?? STATUS_COLOR.neutral,
                                p: 0.25,
                              }}
                            >
                              <Box
                                aria-hidden
                                component="span"
                                sx={{
                                  bgcolor: "currentColor",
                                  borderRadius: "50%",
                                  display: "inline-block",
                                  height: 8,
                                  width: 8,
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        {isDragging ? (
                          <Typography
                            color="text.secondary"
                            sx={{ minHeight: 18 }}
                            variant="caption"
                          >
                            {isDropTarget
                              ? t("staff.catalogDropHere")
                              : isSource
                                ? t("staff.catalogDragging")
                                : " "}
                          </Typography>
                        ) : (
                          <Tooltip
                            title={
                              <Box sx={{ maxWidth: 320, whiteSpace: "pre-wrap" }}>
                                {row.body}
                              </Box>
                            }
                          >
                            <Typography
                              color="text.secondary"
                              sx={{
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 2,
                                display: "-webkit-box",
                                minHeight: 36,
                                overflow: "hidden",
                              }}
                              variant="caption"
                            >
                              {truncateForPreview(row.body, 120)}
                            </Typography>
                          </Tooltip>
                        )}

                        <Typography
                          color="text.secondary"
                          noWrap
                          title={`${formatStaffTimestamp(row.lastSentAt, locale)} · ${formatStaffTimestamp(row.repliedAt, locale)}`}
                          variant="caption"
                        >
                          {formatStaffTimestamp(row.lastSentAt, locale)} ·{" "}
                          {formatLatency(row.responseLatencyMs)}
                        </Typography>

                        <FormControl
                          fullWidth
                          size="small"
                          sx={{
                            pointerEvents: isDragging ? "none" : "auto",
                          }}
                        >
                          <Select
                            disabled={busy || roster.length === 0 || isDragging}
                            displayEmpty
                            onChange={(event) => {
                              const contactId = String(event.target.value);
                              if (contactId) {
                                void assignRow(row, contactId);
                              }
                            }}
                            sx={{
                              "& .MuiSelect-select": {
                                py: 0.75,
                              },
                            }}
                            value={row.assignedContactId ?? ""}
                          >
                            <MenuItem value="">
                              <em>{t("staff.catalogAssignPlaceholder")}</em>
                            </MenuItem>
                            {roster.map((contact) => (
                              <MenuItem key={contact._id} value={contact._id}>
                                {contact.label || contact.phone}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Stack direction="row" spacing={0.75}>
                          <Button
                            disabled={busy || !row.assignedContactId}
                            fullWidth
                            onClick={() => void sendRow(row)}
                            size="small"
                            variant="outlined"
                          >
                            {t("staff.catalogSend")}
                          </Button>
                          <Button
                            color="warning"
                            disabled={busy}
                            fullWidth
                            onClick={() => void deleteRow(row)}
                            size="small"
                          >
                            {t("staff.catalogDelete")}
                          </Button>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            );
          })}
          </Stack>
        )}
      </Box>
    </Paper>
  );
}
