"use client";

import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  buildSnapshotDashboard,
  type SnapshotDashboardModel,
} from "@/lib/snapshot-dashboard";
import { readStoredSnapshotJson } from "@/lib/snapshot-storage";

function subscribeToSnapshotStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getStoredSnapshotSnapshot() {
  return readStoredSnapshotJson();
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

function ProgressRing({ value }: Readonly<{ value: number }>) {
  const size = 140;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        mx: "auto",
      }}
    >
      <Box
        component="svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        sx={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          opacity={0.15}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </Box>
      <Stack
        sx={{
          position: "absolute",
          inset: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {Math.round(clamped)}%
        </Typography>
        <Typography variant="caption" color="text.secondary">
          average
        </Typography>
      </Stack>
    </Box>
  );
}

function BarChart({
  items,
  emptyLabel,
}: Readonly<{
  items: { label: string; count: number }[];
  emptyLabel: string;
}>) {
  const max = Math.max(...items.map((item) => item.count), 1);

  if (items.every((item) => item.count === 0)) {
    return (
      <Typography variant="body2" color="text.secondary">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <Stack spacing={1.25}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack
            direction="row"
            sx={{ mb: 0.5, justifyContent: "space-between" }}
          >
            <Typography variant="body2">{item.label}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.count}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={(item.count / max) * 100}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>
      ))}
    </Stack>
  );
}

function DashboardBody({ model }: Readonly<{ model: SnapshotDashboardModel }>) {
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
        <Paper variant="outlined" sx={{ p: 2.5, color: "primary.main" }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Overall progress
          </Typography>
          <ProgressRing value={model.averageProgress} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Duration mix
          </Typography>
          <BarChart
            items={model.durationBuckets}
            emptyLabel="No duration data yet."
          />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Tasks by sector
          </Typography>
          <BarChart
            items={model.sectorCounts.slice(0, 8)}
            emptyLabel="No sector data yet."
          />
        </Paper>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
          Objective tasks
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Sector</TableCell>
                <TableCell align="right">Duration</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Progress</TableCell>
                <TableCell>Window</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {model.objectiveTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography variant="body2" color="text.secondary">
                      No objective tasks in this snapshot.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                model.objectiveTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {task.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {task.id}
                      </Typography>
                    </TableCell>
                    <TableCell>{task.sector ?? "—"}</TableCell>
                    <TableCell align="right">
                      {task.duracion === null ? "—" : `${task.duracion}d`}
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" color="text.secondary">
                          {task.avance === null
                            ? "—"
                            : `${Math.round(task.avance)}%`}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, Math.min(100, task.avance ?? 0))}
                          sx={{ height: 6, borderRadius: 1 }}
                        />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {[task.ini, task.fin].filter(Boolean).join(" → ") ||
                          "—"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {model.contextTasks.length > 0 ? (
        <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Typography variant="h6" component="h2" sx={{ px: 1, pb: 1.5 }}>
            Context tasks
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Sector</TableCell>
                  <TableCell align="right">Duration</TableCell>
                  <TableCell>Window</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {model.contextTasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>{task.label}</TableCell>
                    <TableCell>{task.sector ?? "—"}</TableCell>
                    <TableCell align="right">
                      {task.duracion === null ? "—" : `${task.duracion}d`}
                    </TableCell>
                    <TableCell>
                      {[task.ini, task.fin].filter(Boolean).join(" → ") || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
    subscribeToSnapshotStorage,
    getStoredSnapshotSnapshot,
    getServerSnapshotSnapshot,
  );
  const model = modelFromStoredJson(raw);

  if (!model) {
    return <EmptyDashboard />;
  }

  return <DashboardBody model={model} />;
}
