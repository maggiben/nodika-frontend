"use client";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { useCallback, useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  buildPerformanceDraft,
  chartHasNoReports,
} from "@/lib/staff-org-chart-draft";
import {
  createReportId,
  emptyOrgChart,
  hydrateOrgChartsFromRoster,
  readOrgChart,
  reportRoleLabel,
  saveOrgChartToCore,
  type StaffOrgChart,
  type StaffOrgReport,
  type StaffReportRole,
} from "@/lib/staff-org-chart";
import {
  listStoredProjects,
  refreshProjectLibrary,
  type StoredProject,
} from "@/lib/snapshot-storage";
import { parseStaffRoster } from "@/lib/staff-roster";

type LeadInfo = {
  id: string;
  label: string;
  phone: string | null;
};

type StaffOrgChartEditorProps = {
  contactId: string;
};

const ROLES: StaffReportRole[] = ["operario", "jornalero", "otro"];

export function StaffOrgChartEditor({ contactId }: StaffOrgChartEditorProps) {
  const { locale, t } = useDictionary();
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chart, setChart] = useState<StaffOrgChart>(() =>
    emptyOrgChart(contactId),
  );
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [draftName, setDraftName] = useState("");
  const [draftRole, setDraftRole] = useState<StaffReportRole>("operario");
  const [draftRoleOther, setDraftRoleOther] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);

  const roleLabels = useMemo(
    () =>
      ({
        operario: t("staff.org.roles.operario"),
        jornalero: t("staff.org.roles.jornalero"),
        otro: t("staff.org.roles.otro"),
      }) satisfies Record<StaffReportRole, string>,
    [t],
  );

  const projectOptions = useMemo(() => {
    const byId = new Map(projects.map((project) => [project.id, project]));
    for (const id of selectedProjectIds) {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          name: id,
          json: "{}",
          updatedAt: new Date(0).toISOString(),
        });
      }
    }
    return [...byId.values()];
  }, [projects, selectedProjectIds]);

  const persist = useCallback(
    async (nextReports: StaffOrgReport[], nextProjectIds: string[]) => {
      setSaving(true);
      setSavedMessage(null);
      setSaveError(null);
      const result = await saveOrgChartToCore({
        contactId,
        reports: nextReports,
        projectIds: nextProjectIds,
        contactLabel: lead?.label,
      });
      setSaving(false);
      if (!result.ok) {
        setSaveError(result.message || t("staff.org.saveError"));
        return false;
      }
      setChart(result.chart);
      setSelectedProjectIds(result.chart.projectIds);
      setSavedMessage(t("staff.org.saved"));
      setDraft(null);
      setCopyMessage(null);
      return true;
    },
    [contactId, lead?.label, t],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLead() {
      setLoading(true);
      setLeadError(null);
      try {
        const [rosterResponse, libraryRefresh] = await Promise.all([
          fetch("/api/messaging/roster", { cache: "no-store" }),
          refreshProjectLibrary(),
        ]);
        if (!cancelled) {
          setProjects(libraryRefresh.library.projects);
        }

        const body: unknown = await rosterResponse.json().catch(() => null);
        let rows = rosterResponse.ok ? parseStaffRoster(body) : [];

        if (!rosterResponse.ok) {
          const contactsResponse = await fetch("/api/messaging/contacts", {
            cache: "no-store",
          });
          const contactsBody: unknown = await contactsResponse
            .json()
            .catch(() => null);
          if (contactsResponse.ok && Array.isArray(contactsBody)) {
            rows = parseStaffRoster(
              contactsBody.filter(
                (item) =>
                  typeof item === "object" &&
                  item !== null &&
                  "tags" in item &&
                  Array.isArray((item as { tags: unknown }).tags) &&
                  (item as { tags: string[] }).tags.includes("staff"),
              ),
            );
          }
        }

        if (cancelled) {
          return;
        }

        hydrateOrgChartsFromRoster(rows);

        const match = rows.find((row) => row._id === contactId);
        if (!match) {
          setLead(null);
          setLeadError(t("staff.org.missingLead"));
          setLoading(false);
          return;
        }

        const info: LeadInfo = {
          id: match._id,
          label: match.label?.trim() || match.phone,
          phone: match.phone,
        };
        setLead(info);
        const existing = readOrgChart(contactId);
        const nextChart = existing
          ? { ...existing, contactLabel: info.label }
          : emptyOrgChart(contactId, info.label, match.projectIds ?? []);
        setChart(nextChart);
        setSelectedProjectIds(nextChart.projectIds);
        if (libraryRefresh.ok) {
          setProjects(listStoredProjects());
        }
      } catch {
        if (!cancelled) {
          setLeadError(t("staff.unreachable"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadLead();
    return () => {
      cancelled = true;
    };
  }, [contactId, t]);

  function resetDraftForm() {
    setDraftName("");
    setDraftRole("operario");
    setDraftRoleOther("");
    setEditingId(null);
  }

  function startEdit(report: StaffOrgReport) {
    setEditingId(report.id);
    setDraftName(report.name);
    setDraftRole(report.role);
    setDraftRoleOther(report.roleOther ?? "");
    setSavedMessage(null);
    setSaveError(null);
  }

  async function saveReport() {
    const name = draftName.trim();
    if (!name) {
      return;
    }
    const roleOther =
      draftRole === "otro" ? draftRoleOther.trim() || undefined : undefined;
    const report: StaffOrgReport = {
      id: editingId ?? createReportId(),
      name,
      role: draftRole,
      ...(roleOther ? { roleOther } : {}),
    };
    const without = chart.reports.filter((item) => item.id !== report.id);
    const nextReports = editingId
      ? chart.reports.map((item) => (item.id === report.id ? report : item))
      : [...without, report];
    const ok = await persist(nextReports, selectedProjectIds);
    if (ok) {
      resetDraftForm();
    }
  }

  async function removeReport(reportId: string) {
    const ok = await persist(
      chart.reports.filter((item) => item.id !== reportId),
      selectedProjectIds,
    );
    if (ok && editingId === reportId) {
      resetDraftForm();
    }
  }

  async function saveProjects() {
    await persist(chart.reports, selectedProjectIds);
  }

  function generateDraft() {
    setCopyMessage(null);
    if (chartHasNoReports(chart)) {
      setDraft(null);
      setCopyMessage(t("staff.org.draftEmpty"));
      return;
    }
    const text = buildPerformanceDraft({
      locale,
      leadName: lead?.label ?? "",
      chart,
    });
    setDraft(text);
  }

  async function copyDraft() {
    if (!draft) {
      return;
    }
    try {
      await navigator.clipboard.writeText(draft);
      setCopyMessage(t("staff.org.copied"));
    } catch {
      setCopyMessage(t("staff.org.copyError"));
    }
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>{t("staff.org.loading")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Button
            component={Link}
            href={`/${locale}/staff`}
            size="small"
            sx={{ mb: 1 }}
          >
            {t("staff.org.backToRoster")}
          </Button>
          <Typography component="h1" variant="h4">
            {t("staff.org.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t("staff.org.description")}
          </Typography>
        </Box>

        {leadError ? <Alert severity="error">{leadError}</Alert> : null}
        {saveError ? <Alert severity="error">{saveError}</Alert> : null}
        {savedMessage ? <Alert severity="success">{savedMessage}</Alert> : null}

        {lead ? (
          <Paper sx={{ p: 3 }}>
            <Typography component="h2" variant="h6">
              {t("staff.org.leadTitle")}
            </Typography>
            <Typography sx={{ mt: 1 }}>
              {t("staff.org.leadName", { name: lead.label })}
            </Typography>
            {lead.phone ? (
              <Typography color="text.secondary">
                {t("staff.org.leadPhone", { phone: lead.phone })}
              </Typography>
            ) : null}
            <Typography sx={{ mt: 1 }}>
              {t("staff.org.teamCount", { count: chart.reports.length })}
            </Typography>
          </Paper>
        ) : null}

        {lead ? (
          <Paper sx={{ p: 3 }}>
            <Typography component="h2" variant="h6">
              {t("staff.org.projectsTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
              {t("staff.org.projectsDescription")}
            </Typography>
            <Autocomplete
              disableCloseOnSelect
              getOptionLabel={(option) =>
                option.name === option.id
                  ? option.id
                  : `${option.name} (${option.id})`
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              multiple
              onChange={(_event, value) => {
                setSelectedProjectIds(value.map((project) => project.id));
                setSavedMessage(null);
                setSaveError(null);
              }}
              options={projectOptions}
              renderOption={(props, option, { selected }) => (
                <li {...props} key={option.id}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  {option.name === option.id
                    ? option.id
                    : `${option.name} (${option.id})`}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("staff.org.projectsLabel")}
                  placeholder={t("staff.org.projectsPlaceholder")}
                />
              )}
              value={projectOptions.filter((project) =>
                selectedProjectIds.includes(project.id),
              )}
            />
            <Button
              disabled={saving}
              onClick={() => void saveProjects()}
              sx={{ mt: 2 }}
              variant="outlined"
            >
              {t("staff.org.saveProjects")}
            </Button>
          </Paper>
        ) : null}

        {lead ? (
          <Paper sx={{ p: 3 }}>
            <Typography component="h2" variant="h6">
              {t("staff.org.reportsTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
              {t("staff.org.reportsDescription")}
            </Typography>

            <Stack spacing={2} sx={{ mb: 3, maxWidth: 560 }}>
              <TextField
                fullWidth
                label={t("staff.org.reportName")}
                onChange={(event) => setDraftName(event.target.value)}
                value={draftName}
              />
              <FormControl fullWidth>
                <InputLabel id="staff-org-role-label">
                  {t("staff.org.reportRole")}
                </InputLabel>
                <Select
                  label={t("staff.org.reportRole")}
                  labelId="staff-org-role-label"
                  onChange={(event) =>
                    setDraftRole(event.target.value as StaffReportRole)
                  }
                  value={draftRole}
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {roleLabels[role]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {draftRole === "otro" ? (
                <TextField
                  fullWidth
                  label={t("staff.org.roleOther")}
                  onChange={(event) => setDraftRoleOther(event.target.value)}
                  value={draftRoleOther}
                />
              ) : null}
              <Stack direction="row" spacing={1}>
                <Button
                  disabled={!draftName.trim() || saving}
                  onClick={() => void saveReport()}
                  variant="contained"
                >
                  {editingId
                    ? t("staff.org.updateReport")
                    : t("staff.org.addReport")}
                </Button>
                {editingId ? (
                  <Button onClick={resetDraftForm}>
                    {t("staff.org.cancelEdit")}
                  </Button>
                ) : null}
              </Stack>
            </Stack>

            {chart.reports.length === 0 ? (
              <Typography color="text.secondary">
                {t("staff.org.noReports")}
              </Typography>
            ) : (
              <Stack spacing={1}>
                {chart.reports.map((report) => (
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    key={report.id}
                    spacing={1}
                    sx={{
                      alignItems: { xs: "stretch", sm: "center" },
                      borderBottom: 1,
                      borderColor: "divider",
                      justifyContent: "space-between",
                      py: 1,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>
                        {report.name}
                      </Typography>
                      <Typography color="text.secondary" variant="body2">
                        {reportRoleLabel(report, roleLabels)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        onClick={() => startEdit(report)}
                        size="small"
                        variant="outlined"
                      >
                        {t("staff.org.editReport")}
                      </Button>
                      <Button
                        color="warning"
                        disabled={saving}
                        onClick={() => void removeReport(report.id)}
                        size="small"
                      >
                        {t("staff.org.removeReport")}
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Paper>
        ) : null}

        {lead ? (
          <Paper sx={{ p: 3 }}>
            <Typography component="h2" variant="h6">
              {t("staff.org.draftTitle")}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2, mt: 0.5 }}>
              {t("staff.org.draftDescription")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button onClick={generateDraft} variant="contained">
                {t("staff.org.generateDraft")}
              </Button>
              <Button disabled={!draft} onClick={() => void copyDraft()}>
                {t("staff.org.copyDraft")}
              </Button>
            </Stack>
            <Alert severity="info" sx={{ mt: 2 }}>
              {t("staff.org.sendUnavailable")}
            </Alert>
            {copyMessage ? (
              <Alert
                severity={
                  copyMessage === t("staff.org.draftEmpty") ||
                  copyMessage === t("staff.org.copyError")
                    ? "warning"
                    : "success"
                }
                sx={{ mt: 2 }}
              >
                {copyMessage}
              </Alert>
            ) : null}
            {draft ? (
              <TextField
                fullWidth
                multiline
                minRows={8}
                onChange={(event) => setDraft(event.target.value)}
                sx={{ mt: 2 }}
                value={draft}
              />
            ) : null}
          </Paper>
        ) : null}
      </Stack>
    </Container>
  );
}
