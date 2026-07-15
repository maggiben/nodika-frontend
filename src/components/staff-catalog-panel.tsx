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
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  parseStaffCatalog,
  type StaffCatalogRow,
} from "@/lib/staff-catalog";
import type { StaffRosterRow } from "@/lib/staff-roster";
import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
  statusFromPersistedLatencyMs,
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

const VALID_STATUSES: StaffResponseStatus[] = [
  "green",
  "yellow",
  "red",
  "neutral",
  "pending",
];

/**
 * Prefer persisted responseStatus, then persisted latency, then derive from
 * timestamps for the traffic-light circle.
 */
function resolveCatalogStatus(row: StaffCatalogRow): StaffResponseStatus {
  if (
    VALID_STATUSES.includes(row.responseStatus as StaffResponseStatus) &&
    row.responseStatus !== "neutral"
  ) {
    return row.responseStatus as StaffResponseStatus;
  }
  if (row.responseLatencyMs !== null && row.responseLatencyMs !== undefined) {
    return statusFromPersistedLatencyMs(row.responseLatencyMs);
  }
  return computeStaffResponseStatus(row.lastSentAt, row.repliedAt);
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

  const columns = useMemo<GridColDef<StaffCatalogRow>[]>(
    () => [
      {
        field: "title",
        headerName: t("staff.catalogColumns.title"),
        flex: 1,
        minWidth: 140,
      },
      {
        field: "body",
        headerName: t("staff.catalogColumns.body"),
        flex: 1.4,
        minWidth: 180,
        valueGetter: (_value, row) => truncateForPreview(row.body),
        renderCell: (params: GridRenderCellParams<StaffCatalogRow>) => (
          <Tooltip title={params.row.body}>
            <Typography
              noWrap
              sx={{ maxWidth: "100%" }}
              variant="body2"
            >
              {truncateForPreview(params.row.body)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        field: "assignedLabel",
        headerName: t("staff.catalogColumns.assignee"),
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) =>
          row.assignedLabel || row.assignedPhone || "—",
      },
      {
        field: "lastSentAt",
        headerName: t("staff.catalogColumns.lastSent"),
        flex: 1,
        minWidth: 140,
        renderCell: (params) =>
          formatStaffTimestamp(params.row.lastSentAt, locale),
      },
      {
        field: "repliedAt",
        headerName: t("staff.catalogColumns.repliedAt"),
        flex: 1,
        minWidth: 140,
        renderCell: (params) =>
          formatStaffTimestamp(params.row.repliedAt, locale),
      },
      {
        field: "responseLatencyMs",
        headerName: t("staff.catalogColumns.latency"),
        width: 110,
        valueGetter: (_value, row) => row.responseLatencyMs ?? -1,
        renderCell: (params) => {
          const ms = params.row.responseLatencyMs;
          if (ms === null) {
            return "—";
          }
          const hours = ms / (60 * 60 * 1000);
          if (hours < 48) {
            return `${Math.round(hours)}h`;
          }
          return `${Math.round(hours / 24)}d`;
        },
      },
      {
        field: "responseStatus",
        headerName: t("staff.catalogColumns.status"),
        width: 100,
        renderCell: (params) => {
          const status = resolveCatalogStatus(params.row);
          const labelText = t(`staff.status.${status}`);
          return (
            <Tooltip title={labelText}>
              <IconButton
                aria-label={labelText}
                size="small"
                sx={{ color: STATUS_COLOR[status] ?? STATUS_COLOR.neutral }}
              >
                <Box
                  aria-hidden
                  component="span"
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    bgcolor: "currentColor",
                    display: "inline-block",
                  }}
                />
              </IconButton>
            </Tooltip>
          );
        },
      },
      {
        field: "actions",
        headerName: t("staff.catalogColumns.actions"),
        sortable: false,
        filterable: false,
        width: 320,
        renderCell: (params) => {
          const busy = busyId === params.row._id;
          return (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  disabled={busy || roster.length === 0}
                  displayEmpty
                  onChange={(event) => {
                    const contactId = String(event.target.value);
                    if (contactId) {
                      void assignRow(params.row, contactId);
                    }
                  }}
                  value={params.row.assignedContactId ?? ""}
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
              <Button
                disabled={busy || !params.row.assignedContactId}
                onClick={() => void sendRow(params.row)}
                size="small"
                variant="outlined"
              >
                {t("staff.catalogSend")}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [assignRow, busyId, locale, roster, sendRow, t],
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography component="h2" variant="h6">
        {t("staff.catalogTitle")}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
        {t("staff.catalogDescription")}
      </Typography>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {message ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      ) : null}

      <Stack spacing={2} sx={{ mb: 2, maxWidth: 720 }}>
        <TextField
          label={t("staff.catalogMessageTitle")}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <TextField
          label={t("staff.catalogMessageBody")}
          minRows={3}
          multiline
          onChange={(event) => setBody(event.target.value)}
          value={body}
        />
        <FormControl size="small">
          <InputLabel id="catalog-assign-new">
            {t("staff.catalogAssignPlaceholder")}
          </InputLabel>
          <Select
            label={t("staff.catalogAssignPlaceholder")}
            labelId="catalog-assign-new"
            onChange={(event) => setAssignContactId(String(event.target.value))}
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
          disabled={saving || title.trim().length === 0 || body.trim().length === 0}
          onClick={() => void saveCatalogMessage()}
          variant="contained"
        >
          {saving ? t("staff.saving") : t("staff.catalogSave")}
        </Button>
      </Stack>

      {rows.length === 0 ? (
        <Typography color="text.secondary">{t("staff.catalogEmpty")}</Typography>
      ) : (
        <DataGrid
          autoHeight
          columns={columns}
          density="compact"
          disableRowSelectionOnClick
          getRowId={(row) => row._id}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
          pageSizeOptions={[10, 25]}
          rows={rows}
          showToolbar
          slotProps={{
            toolbar: { showQuickFilter: true },
          }}
          sx={{ border: 0 }}
        />
      )}
    </Paper>
  );
}
