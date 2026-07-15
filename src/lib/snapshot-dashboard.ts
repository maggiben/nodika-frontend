export type SnapshotTaskView = {
  id: string;
  label: string;
  avance: number | null;
  duracion: number | null;
  ini: string | null;
  fin: string | null;
  sector: string | null;
};

export type SnapshotDashboardModel = {
  projectName: string;
  projectId: string | null;
  cicloInicio: string | null;
  cicloFin: string | null;
  objectiveTasks: SnapshotTaskView[];
  contextTasks: SnapshotTaskView[];
  averageProgress: number;
  completedCount: number;
  totalObjectiveTasks: number;
  durationBuckets: { label: string; count: number }[];
  sectorCounts: { label: string; count: number }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toTask(value: unknown, index: number): SnapshotTaskView {
  const record = isRecord(value) ? value : {};
  return {
    id: asString(record.id) ?? `task-${index + 1}`,
    label: asString(record.label) ?? `Task ${index + 1}`,
    avance: asNumber(record.avance_base),
    duracion: asNumber(record.duracion),
    ini: asString(record.ini),
    fin: asString(record.fin),
    sector: asString(record.sector),
  };
}

function durationBucket(days: number | null): string {
  if (days === null) {
    return "Unknown";
  }
  if (days <= 3) {
    return "1–3 days";
  }
  if (days <= 7) {
    return "4–7 days";
  }
  if (days <= 14) {
    return "8–14 days";
  }
  return "15+ days";
}

export function buildSnapshotDashboard(
  value: unknown,
): SnapshotDashboardModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const meta = isRecord(value.meta) ? value.meta : {};
  const objectiveTasks = Array.isArray(value.tareas_con_objetivo)
    ? value.tareas_con_objetivo.map(toTask)
    : [];
  const contextTasks = Array.isArray(value.tareas_contexto)
    ? value.tareas_contexto.map(toTask)
    : [];

  const progressValues = objectiveTasks
    .map((task) => task.avance)
    .filter((value): value is number => value !== null);
  const averageProgress =
    progressValues.length > 0
      ? progressValues.reduce((sum, value) => sum + value, 0) /
        progressValues.length
      : 0;
  const completedCount = progressValues.filter((value) => value >= 100).length;

  const bucketOrder = [
    "1–3 days",
    "4–7 days",
    "8–14 days",
    "15+ days",
    "Unknown",
  ];
  const bucketMap = new Map(bucketOrder.map((label) => [label, 0]));
  for (const task of objectiveTasks) {
    const key = durationBucket(task.duracion);
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1);
  }

  const sectorMap = new Map<string, number>();
  for (const task of [...objectiveTasks, ...contextTasks]) {
    const key = task.sector ?? "Unassigned";
    sectorMap.set(key, (sectorMap.get(key) ?? 0) + 1);
  }

  return {
    projectName: asString(meta.projectNombre) ?? "Untitled project",
    projectId: asString(meta.projectId),
    cicloInicio: asString(meta.ciclo_inicio),
    cicloFin: asString(meta.ciclo_fin),
    objectiveTasks,
    contextTasks,
    averageProgress,
    completedCount,
    totalObjectiveTasks: objectiveTasks.length,
    durationBuckets: bucketOrder.map((label) => ({
      label,
      count: bucketMap.get(label) ?? 0,
    })),
    sectorCounts: [...sectorMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count),
  };
}
