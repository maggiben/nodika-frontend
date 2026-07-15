"use client";

import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef, type GridRenderCellParams } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { StaffCatalogPanel } from "@/components/staff-catalog-panel";
import {
  parseStaffRoster,
  type StaffRosterRow,
  type StaffTemplate,
} from "@/lib/staff-roster";
import {
  computeStaffResponseStatus,
  formatStaffTimestamp,
  statusFromPersistedLatencyMs,
  type StaffResponseStatus,
} from "@/lib/staff-response-status";

const TEMPLATE_TOKENS = [
  "percent",
  "duration",
  "avance",
  "notes",
  "week",
  "ciclo_name",
  "ciclo_inicio",
  "ciclo_fin",
] as const;

const DEFAULT_TEMPLATE_KEY = "weekly_status";
const DEFAULT_TEMPLATE_BODY =
  "Ciclo {{ciclo_inicio}} → {{ciclo_fin}}\nSemana {{week}}: {{percent}}%\nDuración: {{duration}}\nAvance: {{avance}}\nNotas: {{notes}}";

const STATUS_COLOR: Record<StaffResponseStatus, string> = {
  green: "#2e7d32",
  yellow: "#ed6c02",
  red: "#d32f2f",
  neutral: "#9e9e9e",
  pending: "#ed6c02",
};

function statusLabelKey(status: StaffResponseStatus): string {
  return `staff.status.${status}`;
}

const VALID_ROSTER_STATUSES: StaffResponseStatus[] = [
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
function resolveRosterStatus(row: StaffRosterRow): StaffResponseStatus {
  if (
    row.responseStatus !== undefined &&
    VALID_ROSTER_STATUSES.includes(row.responseStatus as StaffResponseStatus) &&
    row.responseStatus !== "neutral"
  ) {
    return row.responseStatus as StaffResponseStatus;
  }
  if (row.responseLatencyMs !== null && row.responseLatencyMs !== undefined) {
    return statusFromPersistedLatencyMs(row.responseLatencyMs);
  }
  return computeStaffResponseStatus(row.lastSentAt, row.lastReceivedAt);
}

export function StaffMessagingForm() {
  const { locale, t } = useDictionary();
  const [rows, setRows] = useState<StaffRosterRow[]>([]);
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [templateKey, setTemplateKey] = useState(DEFAULT_TEMPLATE_KEY);
  const [templateName, setTemplateName] = useState("Estado semanal");
  const [templateBody, setTemplateBody] = useState(DEFAULT_TEMPLATE_BODY);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const [busyRowId, setBusyRowId] = useState<string | null>(null);
  const [remindTarget, setRemindTarget] = useState<StaffRosterRow | null>(null);

  const loadRoster = useCallback(async () => {
    const rosterResponse = await fetch("/api/messaging/roster");
    const rosterBody: unknown = await rosterResponse.json().catch(() => null);

    if (rosterResponse.ok) {
      return parseStaffRoster(rosterBody);
    }

    // Degraded mode: fall back to contacts list.
    const contactsResponse = await fetch("/api/messaging/contacts");
    const contactsBody: unknown = await contactsResponse
      .json()
      .catch(() => null);
    if (!contactsResponse.ok) {
      const message =
        (typeof rosterBody === "object" &&
          rosterBody !== null &&
          "message" in rosterBody &&
          typeof rosterBody.message === "string" &&
          rosterBody.message) ||
        (typeof contactsBody === "object" &&
          contactsBody !== null &&
          "message" in contactsBody &&
          typeof contactsBody.message === "string" &&
          contactsBody.message) ||
        t("staff.loadError");
      throw new Error(message);
    }

    if (!Array.isArray(contactsBody)) {
      return [];
    }

    return contactsBody
      .filter(
        (item): item is { _id: string; phone: string; label?: string; active?: boolean; tags?: string[] } =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { _id?: unknown })._id === "string" &&
          typeof (item as { phone?: unknown }).phone === "string",
      )
      .filter(
        (item) =>
          item.active !== false &&
          (item.tags?.includes("staff") ?? true),
      )
      .map((item) => ({
        _id: item._id,
        phone: item.phone,
        label: item.label,
        active: item.active !== false,
        tags: item.tags ?? ["staff"],
        lastSentAt: null,
        lastReceivedAt: null,
        lastTemplateKey: null,
        messageTypes: [],
        hasOutbound: false,
      }));
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [roster, templatesResponse] = await Promise.all([
          loadRoster(),
          fetch(`/api/messaging/templates?language=${locale}`),
        ]);

        const templatesBody: unknown = await templatesResponse
          .json()
          .catch(() => null);

        if (!templatesResponse.ok) {
          const message =
            (typeof templatesBody === "object" &&
              templatesBody !== null &&
              "message" in templatesBody &&
              typeof templatesBody.message === "string" &&
              templatesBody.message) ||
            t("staff.loadError");
          if (!cancelled) {
            setError(message);
          }
          return;
        }

        if (!cancelled) {
          setRows(roster);
          const nextTemplates = Array.isArray(templatesBody)
            ? (templatesBody as StaffTemplate[])
            : [];
          setTemplates(nextTemplates);
          const selected =
            nextTemplates.find((item) => item.key === DEFAULT_TEMPLATE_KEY) ??
            nextTemplates[0];
          if (selected) {
            setTemplateKey(selected.key);
            setTemplateName(selected.name);
            setTemplateBody(selected.body?.text ?? DEFAULT_TEMPLATE_BODY);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : t("staff.unreachable"),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadRoster, locale, t]);

  async function saveContact() {
    setSavingContact(true);
    setActionMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/messaging/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          label: label.trim() || undefined,
          active: true,
          tags: ["staff"],
        }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.contactSaveError"),
        );
        return;
      }

      setPhone("");
      setLabel("");
      setActionMessage(t("staff.contactSaved"));
      setRows(await loadRoster());
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setSavingContact(false);
    }
  }

  const removeContact = useCallback(
    async (row: StaffRosterRow) => {
      setBusyRowId(row._id);
      setActionMessage(null);
      setError(null);
      try {
        const response = await fetch(
          `/api/messaging/contacts/${encodeURIComponent(row._id)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ active: false }),
          },
        );
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof body === "object" &&
              body !== null &&
              "message" in body &&
              typeof body.message === "string"
              ? body.message
              : t("staff.removeError"),
          );
          return;
        }
        setActionMessage(t("staff.removed"));
        setRows(await loadRoster());
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyRowId(null);
      }
    },
    [loadRoster, t],
  );

  const sendTest = useCallback(
    async (row: StaffRosterRow) => {
      setBusyRowId(row._id);
      setActionMessage(null);
      setError(null);
      try {
        const response = await fetch("/api/messaging/test-send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: row.phone,
            templateKey,
          }),
        });
        const body: unknown = await response.json().catch(() => null);
        if (!response.ok) {
          setError(
            typeof body === "object" &&
              body !== null &&
              "message" in body &&
              typeof body.message === "string"
              ? body.message
              : t("staff.testError"),
          );
          return;
        }
        setActionMessage(t("staff.testSent"));
        setRows(await loadRoster());
      } catch {
        setError(t("staff.unreachable"));
      } finally {
        setBusyRowId(null);
      }
    },
    [loadRoster, t, templateKey],
  );

  async function confirmRemind() {
    if (!remindTarget) {
      return;
    }
    const row = remindTarget;
    setRemindTarget(null);
    setBusyRowId(row._id);
    setActionMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/messaging/remind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: row._id }),
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.remindError"),
        );
        return;
      }
      setActionMessage(t("staff.remindSent"));
      setRows(await loadRoster());
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setBusyRowId(null);
    }
  }

  async function saveTemplate() {
    setSavingTemplate(true);
    setTemplateMessage(null);
    setError(null);
    try {
      const exists = templates.some((item) => item.key === templateKey);
      const payload = {
        ...(exists
          ? {}
          : {
              key: templateKey,
              name: templateName,
            }),
        name: templateName,
        description: t("staff.templateDescription"),
        body: {
          text: templateBody,
          widgets: [],
        },
        active: true,
      };

      const response = await fetch(
        exists
          ? `/api/messaging/templates/${encodeURIComponent(templateKey)}`
          : "/api/messaging/templates",
        {
          method: exists ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(
          typeof body === "object" &&
            body !== null &&
            "message" in body &&
            typeof body.message === "string"
            ? body.message
            : t("staff.templateSaveError"),
        );
        return;
      }

      const template = body as StaffTemplate;
      setTemplates((current) => {
        const without = current.filter((item) => item.key !== template.key);
        return [template, ...without];
      });
      setTemplateMessage(t("staff.templateSaved"));
    } catch {
      setError(t("staff.unreachable"));
    } finally {
      setSavingTemplate(false);
    }
  }

  const columns = useMemo<GridColDef<StaffRosterRow>[]>(
    () => [
      {
        field: "label",
        headerName: t("staff.columns.name"),
        flex: 1,
        minWidth: 140,
        valueGetter: (_value, row) => row.label || row.phone,
      },
      {
        field: "phone",
        headerName: t("staff.columns.phone"),
        flex: 1,
        minWidth: 130,
      },
      {
        field: "messageTypes",
        headerName: t("staff.columns.messageTypes"),
        flex: 1,
        minWidth: 120,
        valueGetter: (_value, row) =>
          row.messageTypes.length > 0
            ? row.messageTypes.join(", ")
            : row.lastTemplateKey || "—",
      },
      {
        field: "lastSentAt",
        headerName: t("staff.columns.lastSent"),
        flex: 1,
        minWidth: 150,
        valueGetter: (_value, row) => row.lastSentAt ?? "",
        renderCell: (params: GridRenderCellParams<StaffRosterRow>) =>
          formatStaffTimestamp(params.row.lastSentAt, locale),
      },
      {
        field: "lastReceivedAt",
        headerName: t("staff.columns.lastReceived"),
        flex: 1,
        minWidth: 150,
        valueGetter: (_value, row) => row.lastReceivedAt ?? "",
        renderCell: (params: GridRenderCellParams<StaffRosterRow>) =>
          formatStaffTimestamp(params.row.lastReceivedAt, locale),
      },
      {
        field: "status",
        headerName: t("staff.columns.status"),
        width: 100,
        sortable: true,
        valueGetter: (_value, row) => resolveRosterStatus(row),
        renderCell: (params: GridRenderCellParams<StaffRosterRow>) => {
          const status = resolveRosterStatus(params.row);
          const labelText = t(statusLabelKey(status));
          return (
            <Tooltip title={labelText}>
              <IconButton
                aria-label={labelText}
                size="small"
                sx={{ color: STATUS_COLOR[status] }}
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
        headerName: t("staff.columns.actions"),
        sortable: false,
        filterable: false,
        width: 280,
        renderCell: (params: GridRenderCellParams<StaffRosterRow>) => {
          const busy = busyRowId === params.row._id;
          return (
            <Stack direction="row" spacing={1} sx={{ py: 0.5 }}>
              <Button
                disabled={busy}
                onClick={() => void sendTest(params.row)}
                size="small"
                variant="outlined"
              >
                {busy ? t("staff.testing") : t("staff.sendTest")}
              </Button>
              <Button
                disabled={busy || !params.row.hasOutbound}
                onClick={() => setRemindTarget(params.row)}
                size="small"
                variant="outlined"
              >
                {t("staff.remind")}
              </Button>
              <Button
                color="warning"
                disabled={busy}
                onClick={() => void removeContact(params.row)}
                size="small"
              >
                {t("staff.remove")}
              </Button>
            </Stack>
          );
        },
      },
    ],
    [busyRowId, locale, removeContact, sendTest, t],
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>{t("staff.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            {t("staff.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t("staff.description")}
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {actionMessage ? (
          <Alert severity="success">{actionMessage}</Alert>
        ) : null}

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("staff.rosterTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("staff.rosterDescription")}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mb: 2, maxWidth: 720 }}
          >
            <TextField
              fullWidth
              label={t("staff.contactLabel")}
              onChange={(event) => setLabel(event.target.value)}
              value={label}
            />
            <TextField
              fullWidth
              label={t("staff.contactPhone")}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="54911..."
              value={phone}
            />
            <Button
              disabled={savingContact || phone.trim().length < 8}
              onClick={() => void saveContact()}
              sx={{ flexShrink: 0 }}
              variant="contained"
            >
              {savingContact ? t("staff.saving") : t("staff.addEmployee")}
            </Button>
          </Stack>

          {rows.length === 0 ? (
            <Typography color="text.secondary">{t("staff.noContacts")}</Typography>
          ) : (
            <DataGrid
              autoHeight
              columns={columns}
              density="compact"
              disableRowSelectionOnClick
              getRowId={(row) => row._id}
              initialState={{
                pagination: { paginationModel: { pageSize: 10, page: 0 } },
                sorting: {
                  sortModel: [{ field: "label", sort: "asc" }],
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              rows={rows}
              showToolbar
              slotProps={{
                toolbar: {
                  showQuickFilter: true,
                },
              }}
              sx={{
                border: 0,
                "& .MuiDataGrid-cell": {
                  alignItems: "center",
                },
              }}
            />
          )}
        </Paper>

        <StaffCatalogPanel roster={rows} />

        <Paper sx={{ p: 3 }}>
          <Typography component="h2" variant="h6">
            {t("staff.templateTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
            {t("staff.templateHelp")}
          </Typography>
          <Stack spacing={2}>
            <TextField
              label={t("staff.templateKey")}
              onChange={(event) => setTemplateKey(event.target.value)}
              value={templateKey}
            />
            <TextField
              label={t("staff.templateName")}
              onChange={(event) => setTemplateName(event.target.value)}
              value={templateName}
            />
            <TextField
              label={t("staff.templateBody")}
              minRows={6}
              multiline
              onChange={(event) => setTemplateBody(event.target.value)}
              value={templateBody}
            />
            <Box>
              <Typography variant="subtitle2">{t("staff.legendTitle")}</Typography>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {TEMPLATE_TOKENS.map((token) => (
                  <Typography key={token} color="text.secondary">
                    {`{{${token}}}`} — {t(`staff.tokens.${token}`)}
                  </Typography>
                ))}
              </Stack>
            </Box>
            <Button
              disabled={savingTemplate || templateBody.trim().length === 0}
              onClick={() => void saveTemplate()}
              variant="contained"
            >
              {savingTemplate ? t("staff.saving") : t("staff.saveTemplate")}
            </Button>
            {templateMessage ? (
              <Alert severity="success">{templateMessage}</Alert>
            ) : null}
          </Stack>
        </Paper>
      </Stack>

      <Dialog
        onClose={() => setRemindTarget(null)}
        open={Boolean(remindTarget)}
      >
        <DialogTitle>{t("staff.remindConfirmTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("staff.remindConfirmBody", {
              name: remindTarget?.label || remindTarget?.phone || "",
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemindTarget(null)}>
            {t("staff.cancel")}
          </Button>
          <Button onClick={() => void confirmRemind()} variant="contained">
            {t("staff.remind")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
