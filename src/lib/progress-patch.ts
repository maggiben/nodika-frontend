import type { ObraProgressSummary } from "@/lib/obra-progress";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function taskPercentById(
  live: ObraProgressSummary | null | undefined,
): Map<string, number> {
  const byTaskId = new Map<string, number>();
  if (!live) {
    return byTaskId;
  }
  for (const report of live.reports) {
    if (!report.taskId) {
      continue;
    }
    if (!byTaskId.has(report.taskId)) {
      byTaskId.set(report.taskId, report.percent);
    }
  }
  return byTaskId;
}

function patchTaskList(
  tasks: unknown,
  byTaskId: Map<string, number>,
): unknown {
  if (!Array.isArray(tasks) || byTaskId.size === 0) {
    return tasks;
  }
  return tasks.map((task) => {
    if (!isRecord(task)) {
      return task;
    }
    const id = typeof task.id === "string" ? task.id : null;
    if (!id || !byTaskId.has(id)) {
      return task;
    }
    return { ...task, avance_base: byTaskId.get(id) };
  });
}

/**
 * Returns pretty-printed snapshot JSON with `avance_base` updated from live
 * progress reports (first percent per taskId wins). Returns null if the
 * snapshot string is not valid JSON.
 */
export function buildProgressPatchJson(
  snapshotJson: string,
  live: ObraProgressSummary | null | undefined,
): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(snapshotJson);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) {
    return JSON.stringify(parsed, null, 2);
  }

  const byTaskId = taskPercentById(live);
  if (byTaskId.size === 0) {
    return JSON.stringify(parsed, null, 2);
  }

  const patched: Record<string, unknown> = { ...parsed };
  if ("tareas_con_objetivo" in parsed) {
    patched.tareas_con_objetivo = patchTaskList(
      parsed.tareas_con_objetivo,
      byTaskId,
    );
  }
  if ("tareas_contexto" in parsed) {
    patched.tareas_contexto = patchTaskList(parsed.tareas_contexto, byTaskId);
  }
  return JSON.stringify(patched, null, 2);
}

export function progressPatchFilename(projectName: string): string {
  const slug = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "project"}-progress-patch.json`;
}

/** Trigger a browser download of a JSON text payload. */
export function downloadJsonFile(filename: string, jsonText: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const blob = new Blob([jsonText], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
