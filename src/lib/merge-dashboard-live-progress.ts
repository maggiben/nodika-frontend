import type {
  SnapshotDashboardModel,
  SnapshotTaskView,
} from "@/lib/snapshot-dashboard";
import {
  hasUsableOverallProgress,
  roleBreakdownItems,
  type ObraProgressRole,
  type ObraProgressSummary,
} from "@/lib/obra-progress";

export type LiveDashboardModel = SnapshotDashboardModel & {
  liveProgress: ObraProgressSummary | null;
  roleBreakdown: { label: string; percent: number }[];
  usingLiveOverall: boolean;
};

function overlayTaskAvance(
  tasks: SnapshotTaskView[],
  live: ObraProgressSummary | null,
): SnapshotTaskView[] {
  if (!live || live.reports.length === 0) {
    return tasks;
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
    return tasks;
  }
  return tasks.map((task) => {
    const livePercent = byTaskId.get(task.id);
    if (livePercent === undefined) {
      return task;
    }
    return { ...task, avance: livePercent };
  });
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

export function mergeDashboardWithLiveProgress(
  model: SnapshotDashboardModel,
  live: ObraProgressSummary | null,
  roleLabels: Record<ObraProgressRole, string>,
): LiveDashboardModel {
  const objectiveTasks = overlayTaskAvance(model.objectiveTasks, live);
  const recomputed = recomputeCompleted(objectiveTasks);
  const usingLiveOverall = hasUsableOverallProgress(live);
  const averageProgress = usingLiveOverall
    ? live.overallPercent
    : recomputed.averageProgress;

  return {
    ...model,
    objectiveTasks,
    averageProgress,
    completedCount: recomputed.completedCount,
    totalObjectiveTasks: recomputed.totalObjectiveTasks,
    liveProgress: live,
    roleBreakdown: roleBreakdownItems(live, roleLabels),
    usingLiveOverall,
  };
}
