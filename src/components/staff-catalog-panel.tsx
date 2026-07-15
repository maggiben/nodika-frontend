"use client";

import {
  Alert,
  Box,
  Button,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { useVisibleInterval } from "@/hooks/use-visible-interval";
import {
  groupCatalogByLead,
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

  const leadGroups = useMemo(() => groupCatalogByLead(rows), [rows]);

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
      if (fromId === toId) {
        return;
      }
      const group = leadGroups.find((item) => item.contactId === contactId);
      if (!group) {
        return;
      }
      const current = group.rows.map((row) => row._id);
      const from = current.indexOf(fromId);
      const to = current.indexOf(toId);
      if (from < 0 || to < 0) {
        return;
      }
      const next = [...current];
      next.splice(from, 1);
      next.splice(to, 0, fromId);
      setBusyId(fromId);
      setError(null);
      setMessage(null);
      try {
        const response = await fetch("/api/messaging/catalog/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contactId, orderedIds: next }),
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
          return;
        }
        setRows(parseStaffCatalog(payload));
        setMessage(t("staff.catalogReordered"));
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyId(null);
        setDragCatalogId(null);
      }
    },
    [leadGroups, t],
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography component="h2" variant="h6">
        {t("staff.catalogTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
        {t("staff.catalogDescription")}
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          maxHeight: { xs: 480, md: 520 },
          overflowY: "auto",
          pr: 0.5,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            p: 1.5,
          }}
        >
          <TextField
            label={t("staff.catalogMessageTitle")}
            onChange={(event) => setTitle(event.target.value)}
            size="small"
            value={title}
          />
          <TextField
            label={t("staff.catalogMessageBody")}
            minRows={3}
            multiline
            onChange={(event) => setBody(event.target.value)}
            size="small"
            sx={{ flex: 1 }}
            value={body}
          />
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
        </Box>

        {rows.length === 0 ? (
          <Box
            sx={{
              alignItems: "center",
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
              display: "flex",
              gridColumn: { xs: "auto", md: "span 3" },
              justifyContent: "center",
              minHeight: 120,
              p: 2,
            }}
          >
            <Typography color="text.secondary" variant="body2">
              {t("staff.catalogEmpty")}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              gridColumn: { xs: "auto", md: "span 3" },
            }}
          >
            {leadGroups.map((group) => (
              <Box key={group.contactId ?? "unassigned"}>
                <Typography sx={{ mb: 1 }} variant="subtitle2">
                  {group.contactId
                    ? t("staff.catalogLeadGroup", { name: group.label })
                    : t("staff.catalogUnassignedGroup")}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mb: 1 }}
                  variant="caption"
                >
                  {group.contactId
                    ? t("staff.catalogOrderHint")
                    : t("staff.catalogUnassignedHint")}
                </Typography>
                <Stack spacing={1}>
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

                    return (
                      <Box
                        draggable={Boolean(group.contactId)}
                        key={row._id}
                        onDragEnd={() => setDragCatalogId(null)}
                        onDragOver={(event) => {
                          if (group.contactId) {
                            event.preventDefault();
                          }
                        }}
                        onDragStart={() => {
                          if (group.contactId) {
                            setDragCatalogId(row._id);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          if (!group.contactId || !dragCatalogId) {
                            return;
                          }
                          void reorderLead(
                            group.contactId,
                            dragCatalogId,
                            row._id,
                          );
                        }}
                        sx={{
                          border: "1px solid",
                          borderColor:
                            dragCatalogId === row._id
                              ? "primary.main"
                              : "divider",
                          borderRadius: 1,
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          opacity: dragCatalogId === row._id ? 0.7 : 1,
                          cursor: group.contactId ? "grab" : "default",
                          p: 1.5,
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "flex-start" }}
                        >
                          {order !== null ? (
                            <Box
                              aria-label={t("staff.catalogOrderBadge", {
                                n: order,
                              })}
                              sx={{
                                minWidth: 28,
                                height: 28,
                                borderRadius: "50%",
                                bgcolor: "primary.main",
                                color: "primary.contrastText",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                typography: "caption",
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {order}
                            </Box>
                          ) : null}
                          <Typography
                            sx={{
                              flex: 1,
                              fontWeight: 600,
                              lineHeight: 1.3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
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
                              }}
                            >
                              <Box
                                aria-hidden
                                component="span"
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: "50%",
                                  bgcolor: "currentColor",
                                  display: "inline-block",
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Stack>

                        <Tooltip
                          title={
                            <Box sx={{ whiteSpace: "pre-wrap", maxWidth: 320 }}>
                              {row.body}
                            </Box>
                          }
                        >
                          <Typography
                            color="text.secondary"
                            sx={{
                              display: "-webkit-box",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "pre-wrap",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                            }}
                            variant="body2"
                          >
                            {truncateForPreview(row.body)}
                          </Typography>
                        </Tooltip>

                        <Typography color="text.secondary" variant="caption">
                          {t("staff.catalogColumns.lastSent")}:{" "}
                          {formatStaffTimestamp(row.lastSentAt, locale)} ·{" "}
                          {t("staff.catalogColumns.repliedAt")}:{" "}
                          {formatStaffTimestamp(row.repliedAt, locale)} ·{" "}
                          {formatLatency(row.responseLatencyMs)}
                        </Typography>

                        <FormControl fullWidth size="small">
                          <Select
                            disabled={busy || roster.length === 0}
                            displayEmpty
                            onChange={(event) => {
                              const contactId = String(event.target.value);
                              if (contactId) {
                                void assignRow(row, contactId);
                              }
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

                        <Stack direction="row" spacing={1}>
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
                </Stack>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
