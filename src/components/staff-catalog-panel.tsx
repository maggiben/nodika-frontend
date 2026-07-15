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
import { useCallback, useEffect, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  parseStaffCatalog,
  type StaffCatalogRow,
} from "@/lib/staff-catalog";
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
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    const response = await fetch("/api/messaging/catalog");
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
              row.assignedContactId
                ? { contactId: row.assignedContactId }
                : {},
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
              onChange={(event) =>
                setAssignContactId(String(event.target.value))
              }
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
          rows.map((row) => {
            const busy = busyId === row._id;
            const status = (
              ["green", "yellow", "red", "neutral", "pending"].includes(
                row.responseStatus,
              )
                ? row.responseStatus
                : computeStaffResponseStatus(row.lastSentAt, row.repliedAt)
            ) as StaffResponseStatus;
            const statusLabel = t(`staff.status.${status}`);

            return (
              <Box
                key={row._id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  minHeight: 0,
                  p: 1.5,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    sx={{
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
                        color: STATUS_COLOR[status] ?? STATUS_COLOR.neutral,
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

                <Tooltip title={row.body}>
                  <Typography
                    color="text.secondary"
                    sx={{
                      display: "-webkit-box",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                    }}
                    variant="body2"
                  >
                    {truncateForPreview(row.body)}
                  </Typography>
                </Tooltip>

                <Typography color="text.secondary" variant="caption">
                  {row.assignedLabel || row.assignedPhone || "—"}
                </Typography>
                <Typography color="text.secondary" variant="caption">
                  {t("staff.catalogColumns.lastSent")}:{" "}
                  {formatStaffTimestamp(row.lastSentAt, locale)}
                </Typography>
                <Typography color="text.secondary" variant="caption">
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
          })
        )}
      </Box>
    </Paper>
  );
}
