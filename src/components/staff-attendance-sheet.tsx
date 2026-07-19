"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DataGrid,
  type GridColDef,
  type GridRenderEditCellParams,
  type GridRowModel,
  useGridApiContext,
} from "@mui/x-data-grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { useEffect, useMemo, useState } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  ATTENDANCE_STATUSES,
  buildAttendanceCsv,
  currentYearMonth,
  daysInYearMonth,
  downloadTextFile,
  filterPeopleByName,
  getMark,
  readAttendanceStore,
  setMark,
  STAFF_ATTENDANCE_CHANGED_EVENT,
  statusShortLabel,
  summarizeAttendance,
  type AttendanceStatus,
} from "@/lib/staff-attendance";
import { chartHasNoReports } from "@/lib/staff-org-chart-draft";
import {
  emptyOrgChart,
  hydrateOrgChartsFromRoster,
  readOrgChart,
  reportRoleLabel,
  STAFF_ORG_CHART_CHANGED_EVENT,
  type StaffReportRole,
} from "@/lib/staff-org-chart";
import { parseStaffRoster } from "@/lib/staff-roster";
import { fetchAuthed } from "@/lib/session-client";

type LeadInfo = {
  id: string;
  label: string;
};

type AttendanceRow = {
  id: string;
  name: string;
  role: string;
} & Record<string, string>;

type StaffAttendanceSheetProps = {
  contactId: string;
};

function MarkEditCell(props: GridRenderEditCellParams<AttendanceRow, string>) {
  const { id, field, value } = props;
  const apiRef = useGridApiContext();

  return (
    <Select
      autoFocus
      displayEmpty
      fullWidth
      size="small"
      value={value ?? ""}
      onChange={(event) => {
        void apiRef.current.setEditCellValue({
          id,
          field,
          value: event.target.value,
        });
      }}
      sx={{ height: "100%" }}
    >
      <MenuItem value="">—</MenuItem>
      {ATTENDANCE_STATUSES.map((status) => (
        <MenuItem key={status} value={status}>
          {statusShortLabel(status)}
        </MenuItem>
      ))}
    </Select>
  );
}

export function StaffAttendanceSheet({ contactId }: StaffAttendanceSheetProps) {
  const { t } = useDictionary();
  const [lead, setLead] = useState<LeadInfo | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearMonth, setYearMonth] = useState(() => currentYearMonth());
  const [search, setSearch] = useState("");
  const [storeTick, setStoreTick] = useState(0);

  const roleLabels = useMemo(
    () =>
      ({
        operario: t("staff.org.roles.operario"),
        jornalero: t("staff.org.roles.jornalero"),
        otro: t("staff.org.roles.otro"),
      }) satisfies Record<StaffReportRole, string>,
    [t],
  );

  const statusLabels = useMemo(
    () =>
      ({
        full_day: t("staff.attendance.marks.fullDay"),
        half_day: t("staff.attendance.marks.halfDay"),
        absent: t("staff.attendance.marks.absent"),
        justified: t("staff.attendance.marks.justified"),
      }) satisfies Record<AttendanceStatus, string>,
    [t],
  );

  useEffect(() => {
    const onChange = () => setStoreTick((n) => n + 1);
    window.addEventListener(STAFF_ATTENDANCE_CHANGED_EVENT, onChange);
    window.addEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onChange);
    return () => {
      window.removeEventListener(STAFF_ATTENDANCE_CHANGED_EVENT, onChange);
      window.removeEventListener(STAFF_ORG_CHART_CHANGED_EVENT, onChange);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLeadError(null);
      try {
        const response = await fetchAuthed("/api/messaging/roster");
        if (!response.ok) {
          throw new Error("roster failed");
        }
        const rows = parseStaffRoster(await response.json());
        hydrateOrgChartsFromRoster(rows);
        if (cancelled) {
          return;
        }
        const row = rows.find((r) => r._id === contactId);
        if (!row) {
          setLead(null);
          setLeadError(t("staff.org.missingLead"));
        } else {
          setLead({
            id: row._id,
            label: row.label?.trim() || row.phone || row._id,
          });
        }
      } catch {
        if (!cancelled) {
          setLeadError(t("staff.org.missingLead"));
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
  }, [contactId, t]);

  const chart = useMemo(() => {
    void storeTick;
    return readOrgChart(contactId) ?? emptyOrgChart(contactId);
  }, [contactId, storeTick]);

  const days = useMemo(() => daysInYearMonth(yearMonth), [yearMonth]);

  const people = useMemo(
    () =>
      chart.reports.map((report) => ({
        id: report.id,
        name: report.name,
        role: reportRoleLabel(report, roleLabels),
      })),
    [chart.reports, roleLabels],
  );

  const filteredPeople = useMemo(
    () => filterPeopleByName(people, search),
    [people, search],
  );

  const rows: AttendanceRow[] = useMemo(() => {
    void storeTick;
    void readAttendanceStore();
    return filteredPeople.map((person) => {
      const row: AttendanceRow = {
        id: person.id,
        name: person.name,
        role: person.role,
      };
      for (const day of days) {
        row[day] = getMark(contactId, person.id, day) ?? "";
      }
      return row;
    });
  }, [contactId, days, filteredPeople, storeTick]);

  const tallies = useMemo(() => {
    void storeTick;
    return summarizeAttendance(
      contactId,
      yearMonth,
      filteredPeople.map((p) => p.id),
    );
  }, [contactId, filteredPeople, storeTick, yearMonth]);

  const columns: GridColDef<AttendanceRow>[] = useMemo(() => {
    const base: GridColDef<AttendanceRow>[] = [
      {
        field: "name",
        headerName: t("staff.attendance.columns.name"),
        minWidth: 160,
        flex: 1,
        editable: false,
      },
      {
        field: "role",
        headerName: t("staff.attendance.columns.role"),
        minWidth: 110,
        editable: false,
      },
    ];

    const dayCols: GridColDef<AttendanceRow>[] = days.map((day) => {
      const dayNum = day.slice(-2);
      return {
        field: day,
        headerName: dayNum,
        width: 56,
        align: "center",
        headerAlign: "center",
        editable: true,
        type: "singleSelect",
        valueOptions: [
          { value: "", label: "—" },
          ...ATTENDANCE_STATUSES.map((status) => ({
            value: status,
            label: `${statusShortLabel(status)} · ${statusLabels[status]}`,
          })),
        ],
        renderCell: (params) => {
          const status = (params.value as string) || null;
          const typed =
            status && ATTENDANCE_STATUSES.includes(status as AttendanceStatus)
              ? (status as AttendanceStatus)
              : null;
          return statusShortLabel(typed) || "·";
        },
        renderEditCell: (params) => <MarkEditCell {...params} />,
      };
    });

    return [...base, ...dayCols];
  }, [days, statusLabels, t]);

  function handleProcessRowUpdate(newRow: GridRowModel<AttendanceRow>) {
    const reportId = String(newRow.id);
    for (const day of days) {
      const raw = String(newRow[day] ?? "");
      const next: AttendanceStatus | null =
        raw && ATTENDANCE_STATUSES.includes(raw as AttendanceStatus)
          ? (raw as AttendanceStatus)
          : null;
      const prev = getMark(contactId, reportId, day);
      if (prev !== next) {
        setMark(contactId, reportId, day, next);
      }
    }
    return newRow;
  }

  function handleExport() {
    const csv = buildAttendanceCsv({
      leadId: contactId,
      leadLabel: lead?.label ?? contactId,
      yearMonth,
      people: people.map((p) => ({ id: p.id, name: p.name })),
      removedLabel: t("staff.attendance.removedPerson"),
    });
    downloadTextFile(`attendance-${contactId}-${yearMonth}.csv`, csv);
  }

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography>{t("staff.attendance.loading")}</Typography>
      </Container>
    );
  }

  const emptyTeam = chartHasNoReports(chart);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, sm: 6 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h1" variant="h4">
            {t("staff.attendance.title")}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {t("staff.attendance.description")}
          </Typography>
          {lead ? (
            <Typography sx={{ mt: 1 }}>
              {t("staff.org.leadName", { name: lead.label })}
            </Typography>
          ) : null}
        </Box>

        {leadError ? <Alert severity="error">{leadError}</Alert> : null}

        <Alert severity="info">{t("staff.attendance.storageNote")}</Alert>

        {emptyTeam ? (
          <Alert severity="warning">{t("staff.attendance.emptyTeam")}</Alert>
        ) : (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { sm: "center" }, flexWrap: "wrap" }}
            >
              <TextField
                label={t("staff.attendance.month")}
                onChange={(event) => setYearMonth(event.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                type="month"
                value={yearMonth}
              />
              <TextField
                label={t("staff.attendance.search")}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("staff.attendance.searchPlaceholder")}
                size="small"
                value={search}
                sx={{ minWidth: 220 }}
              />
              <Button onClick={handleExport} variant="outlined">
                {t("staff.attendance.export")}
              </Button>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              <Chip
                label={t("staff.attendance.tally.fullDay", {
                  count: tallies.full_day,
                })}
              />
              <Chip
                label={t("staff.attendance.tally.halfDay", {
                  count: tallies.half_day,
                })}
              />
              <Chip
                label={t("staff.attendance.tally.absent", {
                  count: tallies.absent,
                })}
              />
              <Chip
                label={t("staff.attendance.tally.justified", {
                  count: tallies.justified,
                })}
              />
            </Stack>

            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <DataGrid
                autoHeight
                columns={columns}
                density="compact"
                disableRowSelectionOnClick
                editMode="cell"
                getRowId={(row) => row.id}
                hideFooter={rows.length <= 25}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25, page: 0 } },
                }}
                pageSizeOptions={[25, 50]}
                processRowUpdate={handleProcessRowUpdate}
                rows={rows}
                sx={{
                  border: 0,
                  minWidth: Math.max(480, 280 + days.length * 56),
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </Container>
  );
}
