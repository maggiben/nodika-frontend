"use client";

import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { Gauge } from "@mui/x-charts/Gauge";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  buildSnapshotDashboard,
  type SnapshotDashboardModel,
  type SnapshotTaskView,
} from "@/lib/snapshot-dashboard";
import {
  readSelectedSnapshotJson,
  subscribeToProjectLibrary,
} from "@/lib/snapshot-storage";

function getSelectedSnapshotSnapshot() {
  return readSelectedSnapshotJson();
}

function getServerSnapshotSnapshot() {
  return null;
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
}: Readonly<{
  items: { label: string; count: number }[];
  emptyLabel: string;
}>) {
  if (items.every((item) => item.count === 0)) {
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
      series={[{ dataKey: "count", label: "Tasks" }]}
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

const objectiveColumns: GridColDef<SnapshotTaskView>[] = [
  {
    field: "label",
    flex: 1.4,
    headerName: "Task",
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
    headerName: "Sector",
    minWidth: 100,
    valueGetter: (_value, row) => row.sector ?? "—",
  },
  {
    field: "duracion",
    headerName: "Duration",
    minWidth: 100,
    type: "number",
    valueGetter: (_value, row) => (row.duracion === null ? null : row.duracion),
    valueFormatter: (value: number | null) =>
      value === null || value === undefined ? "—" : `${value}d`,
  },
  {
    field: "avance",
    headerName: "Progress",
    minWidth: 110,
    type: "number",
    valueGetter: (_value, row) => row.avance,
    valueFormatter: (value: number | null) =>
      value === null || value === undefined ? "—" : `${Math.round(value)}%`,
  },
  {
    field: "window",
    flex: 1,
    headerName: "Window",
    minWidth: 160,
    valueGetter: (_value, row) =>
      [row.ini, row.fin].filter(Boolean).join(" → ") || "—",
  },
];

const contextColumns: GridColDef<SnapshotTaskView>[] = [
  { field: "label", flex: 1.2, headerName: "Task", minWidth: 140 },
  {
    field: "sector",
    flex: 0.7,
    headerName: "Sector",
    minWidth: 100,
    valueGetter: (_value, row) => row.sector ?? "—",
  },
  {
    field: "duracion",
    headerName: "Duration",
    minWidth: 100,
    type: "number",
    valueGetter: (_value, row) => (row.duracion === null ? null : row.duracion),
    valueFormatter: (value: number | null) =>
      value === null || value === undefined ? "—" : `${value}d`,
  },
  {
    field: "window",
    flex: 1,
    headerName: "Window",
    minWidth: 160,
    valueGetter: (_value, row) =>
      [row.ini, row.fin].filter(Boolean).join(" → ") || "—",
  },
];

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
      disableColumnMenu
      disableRowSelectionOnClick
      getRowHeight={() => "auto"}
      getRowId={(row) => row.id}
      hideFooter={rows.length <= 10}
      pageSizeOptions={[10, 25, 50]}
      rows={rows}
      initialState={{
        pagination: { paginationModel: { pageSize: 10, page: 0 } },
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

function DashboardBody({ model }: Readonly<{ model: SnapshotDashboardModel }>) {
  const average = Math.round(Math.max(0, Math.min(100, model.averageProgress)));

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
              "Cycle dates not set"}
            {model.projectId ? ` · ${model.projectId}` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Chip
            color="primary"
            label={`${model.totalObjectiveTasks} objective tasks`}
          />
          <Chip
            color="secondary"
            variant="outlined"
            label={`${model.completedCount} at 100%`}
          />
          <Chip
            variant="outlined"
            label={`${model.contextTasks.length} context tasks`}
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
            Overall progress
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
            Duration mix
          </Typography>
          <CountBarChart
            items={model.durationBuckets}
            emptyLabel="No duration data yet."
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Tasks by sector
          </Typography>
          <CountBarChart
            items={model.sectorCounts.slice(0, 8)}
            emptyLabel="No sector data yet."
          />
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
          Objective tasks
        </Typography>
        <TaskDataGrid
          columns={objectiveColumns}
          emptyLabel="No objective tasks in this snapshot."
          rows={model.objectiveTasks}
        />
      </Paper>

      {model.contextTasks.length > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
            Context tasks
          </Typography>
          <TaskDataGrid
            columns={contextColumns}
            emptyLabel="No context tasks in this snapshot."
            rows={model.contextTasks}
          />
        </Paper>
      ) : null}
    </Stack>
  );
}

function EmptyDashboard() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 3, sm: 5 },
        textAlign: "center",
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom>
        Project status
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ mb: 3, maxWidth: 420, mx: "auto" }}
      >
        Upload a Nordika snapshot JSON from the avatar menu to see progress,
        duration mix, and task grids on this home page.
      </Typography>
      <Button component={Link} href="/upload" variant="contained">
        Upload snapshot
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
  const model = modelFromStoredJson(raw);

  if (!model) {
    return <EmptyDashboard />;
  }

  return <DashboardBody model={model} />;
}
