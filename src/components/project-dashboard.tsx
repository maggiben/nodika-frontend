"use client";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import {
  mergeDashboardWithLiveProgress,
  type LiveDashboardModel,
} from "@/lib/merge-dashboard-live-progress";
import {
  readProgressViewMode,
  subscribeToProgressViewMode,
  type ProgressViewMode,
} from "@/lib/progress-view-mode";
import {
  buildSnapshotDashboard,
  type SnapshotDashboardModel,
  type SnapshotTaskView,
} from "@/lib/snapshot-dashboard";
import {
  readProjectLibrary,
  readSelectedSnapshotJson,
  refreshProjectLibrary,
  subscribeToProjectLibrary,
} from "@/lib/snapshot-storage";
import { useLiveObraProgress } from "@/lib/use-live-obra-progress";

function getSelectedSnapshotSnapshot() {
  return readSelectedSnapshotJson();
}

function getServerSnapshotSnapshot() {
  return null;
}

function getSelectedIdSnapshot(): string {
  return readProjectLibrary().selectedId ?? "";
}

function getServerEmptyId(): string {
  return "";
}

function getProgressViewModeSnapshot(): ProgressViewMode {
  return readProgressViewMode();
}

function getServerProgressViewMode(): ProgressViewMode {
  return "after";
}

function modelFromStoredJson(
  raw: string | null,
): SnapshotDashboardModel | null {
  if (!raw) {
    return null;
  }

  try {
    return buildSnapshotDashboard(JSON.parse(raw));
  } catch {
    return null;
  }
}

function CountBarChart({
  items,
  emptyLabel,
  seriesLabel,
  valueKey = "count",
}: Readonly<{
  items: { label: string; count?: number; percent?: number }[];
  emptyLabel: string;
  seriesLabel: string;
  valueKey?: "count" | "percent";
}>) {
  if (items.every((item) => (item[valueKey] ?? 0) === 0)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <BarChart
      dataset={items}
      height={240}
      layout="horizontal"
      margin={{ left: 16, right: 16, top: 16, bottom: 16 }}
      series={[{ dataKey: valueKey, label: seriesLabel }]}
      yAxis={[
        {
          dataKey: "label",
          scaleType: "band",
          width: 96,
        },
      ]}
    />
  );
}

function buildObjectiveColumns(
  t: (path: string) => string,
): GridColDef<SnapshotTaskView>[] {
  return [
    {
      field: "label",
      flex: 1.4,
      headerName: t("dashboard.columns.task"),
      minWidth: 160,
      renderCell: (params) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {params.row.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.id}
          </Typography>
        </Box>
      ),
    },
    {
      field: "sector",
      flex: 0.7,
      headerName: t("dashboard.columns.sector"),
      minWidth: 100,
      valueGetter: (_value, row) => row.sector ?? "—",
    },
    {
      field: "duracion",
      headerName: t("dashboard.columns.duration"),
      minWidth: 100,
      type: "number",
      valueGetter: (_value, row) =>
        row.duracion === null ? null : row.duracion,
      valueFormatter: (value: number | null) =>
        value === null || value === undefined ? "—" : `${value}d`,
    },
    {
      field: "avance",
      headerName: t("dashboard.columns.progress"),
      minWidth: 110,
      type: "number",
      valueGetter: (_value, row) => row.avance,
      valueFormatter: (value: number | null) =>
        value === null || value === undefined ? "—" : `${Math.round(value)}%`,
    },
    {
      field: "window",
      flex: 1,
      headerName: t("dashboard.columns.window"),
      minWidth: 160,
      valueGetter: (_value, row) =>
        [row.ini, row.fin].filter(Boolean).join(" → ") || "—",
    },
  ];
}

function buildContextColumns(
  t: (path: string) => string,
): GridColDef<SnapshotTaskView>[] {
  return [
    {
      field: "label",
      flex: 1.2,
      headerName: t("dashboard.columns.task"),
      minWidth: 140,
    },
    {
      field: "sector",
      flex: 0.7,
      headerName: t("dashboard.columns.sector"),
      minWidth: 100,
      valueGetter: (_value, row) => row.sector ?? "—",
    },
    {
      field: "duracion",
      headerName: t("dashboard.columns.duration"),
      minWidth: 100,
      type: "number",
      valueGetter: (_value, row) =>
        row.duracion === null ? null : row.duracion,
      valueFormatter: (value: number | null) =>
        value === null || value === undefined ? "—" : `${value}d`,
    },
    {
      field: "window",
      flex: 1,
      headerName: t("dashboard.columns.window"),
      minWidth: 160,
      valueGetter: (_value, row) =>
        [row.ini, row.fin].filter(Boolean).join(" → ") || "—",
    },
  ];
}

function TaskDataGrid({
  rows,
  columns,
  emptyLabel,
}: Readonly<{
  rows: SnapshotTaskView[];
  columns: GridColDef<SnapshotTaskView>[];
  emptyLabel: string;
}>) {
  if (rows.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <DataGrid
      autoHeight
      columns={columns}
      density="compact"
      disableRowSelectionOnClick
      getRowHeight={() => "auto"}
      getRowId={(row) => row.id}
      hideFooter={rows.length <= 10}
      initialState={{
        pagination: { paginationModel: { pageSize: 10, page: 0 } },
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
          py: 1,
          alignItems: "flex-start",
        },
      }}
    />
  );
}

function DashboardBody({ model }: Readonly<{ model: LiveDashboardModel }>) {
  const { t } = useDictionary();
  const average = Math.round(Math.max(0, Math.min(100, model.averageProgress)));
  const objectiveColumns = buildObjectiveColumns(t);
  const contextColumns = buildContextColumns(t);

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        sx={{ alignItems: { md: "flex-end" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {model.projectName}
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {[model.cicloInicio, model.cicloFin].filter(Boolean).join(" → ") ||
              t("dashboard.cycleDatesMissing")}
            {model.projectId ? ` · ${model.projectId}` : ""}
          </Typography>
          {model.usingLiveOverall ? (
            <Typography
              color="text.secondary"
              variant="caption"
              sx={{ display: "block", mt: 0.5 }}
            >
              {t("dashboard.liveProgressHint")}
            </Typography>
          ) : null}
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Chip
            color="primary"
            label={t("dashboard.objectiveTasks", {
              count: model.totalObjectiveTasks,
            })}
          />
          <Chip
            color="secondary"
            variant="outlined"
            label={t("dashboard.completedAt100", {
              count: model.completedCount,
            })}
          />
          <Chip
            variant="outlined"
            label={t("dashboard.contextTasksCount", {
              count: model.contextTasks.length,
            })}
          />
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1.2fr)",
          },
        }}
      >
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("dashboard.overallProgress")}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Gauge
              height={180}
              text={({ value }) => `${value ?? 0}%`}
              value={average}
              valueMax={100}
              width={180}
            />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("dashboard.durationMix")}
          </Typography>
          <CountBarChart
            emptyLabel={t("dashboard.noDurationData")}
            items={model.durationBuckets}
            seriesLabel={t("dashboard.tasksSeries")}
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t("dashboard.tasksBySector")}
          </Typography>
          <CountBarChart
            emptyLabel={t("dashboard.noSectorData")}
            items={model.sectorCounts.slice(0, 8)}
            seriesLabel={t("dashboard.tasksSeries")}
          />
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
          {t("dashboard.objectiveTasksHeading")}
        </Typography>
        <TaskDataGrid
          columns={objectiveColumns}
          emptyLabel={t("dashboard.noObjectiveTasks")}
          rows={model.objectiveTasks}
        />
      </Paper>

      {model.contextTasks.length > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
            {t("dashboard.contextTasksHeading")}
          </Typography>
          <TaskDataGrid
            columns={contextColumns}
            emptyLabel={t("dashboard.noContextTasks")}
            rows={model.contextTasks}
          />
        </Paper>
      ) : null}
    </Stack>
  );
}

function EmptyDashboard() {
  const { locale, t } = useDictionary();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: "center",
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        {t("dashboard.emptyTitle")}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 420, mx: "auto" }}
      >
        {t("dashboard.emptyDescription")}
      </Typography>
      <Button component={Link} href={`/${locale}/upload`} variant="contained">
        {t("dashboard.uploadCta")}
      </Button>
    </Paper>
  );
}

export function ProjectDashboard() {
  const raw = useSyncExternalStore(
    subscribeToProjectLibrary,
    getSelectedSnapshotSnapshot,
    getServerSnapshotSnapshot,
  );
  const selectedId = useSyncExternalStore(
    subscribeToProjectLibrary,
    getSelectedIdSnapshot,
    getServerEmptyId,
  );
  const viewMode = useSyncExternalStore(
    subscribeToProgressViewMode,
    getProgressViewModeSnapshot,
    getServerProgressViewMode,
  );

  useEffect(() => {
    void refreshProjectLibrary();
  }, []);
  const baseModel = modelFromStoredJson(raw);
  const live = useLiveObraProgress(
    baseModel?.projectId ?? (selectedId || null),
  );

  if (!baseModel) {
    return <EmptyDashboard />;
  }

  const applyLive = viewMode === "after";
  const model = applyLive
    ? mergeDashboardWithLiveProgress(baseModel, live)
    : mergeDashboardWithLiveProgress(baseModel, null);

  return <DashboardBody model={model} />;
}
