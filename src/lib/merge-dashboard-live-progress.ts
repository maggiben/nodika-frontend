import type {
  SnapshotDashboardModel,
  SnapshotTaskView,
} from "@/lib/snapshot-dashboard";
import type { ObraProgressSummary } from "@/lib/obra-progress";

export type LiveDashboardModel = SnapshotDashboardModel & {
  liveProgress: ObraProgressSummary | null;
  usingLiveOverall: boolean;
};

function overlayTaskAvance(
  tasks: SnapshotTaskView[],
  live: ObraProgressSummary | null,
): { tasks: SnapshotTaskView[]; overlaidCount: number } {
  if (!live || live.reports.length === 0) {
    return { tasks, overlaidCount: 0 };
  }
  const byTaskId = new Map<string, number>();
  for (const report of live.reports) {
    if (!report.taskId) {
      continue;
    }
    if (!byTaskId.has(report.taskId)) {
      byTaskId.set(report.taskId, report.percent);
    }
  }
  if (byTaskId.size === 0) {
    return { tasks, overlaidCount: 0 };
  }
  let overlaidCount = 0;
  const next = tasks.map((task) => {
    const livePercent = byTaskId.get(task.id);
    if (livePercent === undefined) {
      return task;
    }
    overlaidCount += 1;
    return { ...task, avance: livePercent };
  });
  return { tasks: next, overlaidCount };
}

function recomputeCompleted(
  objectiveTasks: SnapshotTaskView[],
): Pick<
  SnapshotDashboardModel,
  "averageProgress" | "completedCount" | "totalObjectiveTasks"
> {
  const progressValues = objectiveTasks
    .map((task) => task.avance)
    .filter((value): value is number => value !== null);
  return {
    averageProgress:
      progressValues.length > 0
        ? progressValues.reduce((sum, value) => sum + value, 0) /
          progressValues.length
        : 0,
    completedCount: progressValues.filter((value) => value >= 100).length,
    totalObjectiveTasks: objectiveTasks.length,
  };
}

/**
 * Merge live WhatsApp progress into the dashboard model.
 *
 * Overall progress (Progreso general) MUST come from the same objective-task
 * avances shown in the grid. Using `live.overallPercent` was wrong: that value
 * averages catalog/obra replies without `taskId`, so the gauge could show 100%
 * while every task row still showed 0%.
 */
export function mergeDashboardWithLiveProgress(
  model: SnapshotDashboardModel,
  live: ObraProgressSummary | null,
): LiveDashboardModel {
  const { tasks: objectiveTasks, overlaidCount } = overlayTaskAvance(
    model.objectiveTasks,
    live,
  );
  const recomputed = recomputeCompleted(objectiveTasks);

  return {
    ...model,
    objectiveTasks,
    averageProgress: recomputed.averageProgress,
    completedCount: recomputed.completedCount,
    totalObjectiveTasks: recomputed.totalObjectiveTasks,
    liveProgress: live,
    usingLiveOverall: overlaidCount > 0,
  };
}
