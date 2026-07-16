"use client";

import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useSyncExternalStore } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { hasUsableOverallProgress } from "@/lib/obra-progress";
import {
  readProgressViewMode,
  setProgressViewMode,
  subscribeToProgressViewMode,
  type ProgressViewMode,
} from "@/lib/progress-view-mode";
import { buildSnapshotDashboard } from "@/lib/snapshot-dashboard";
import {
  readProjectLibrary,
  readSelectedSnapshotJson,
  subscribeToProjectLibrary,
} from "@/lib/snapshot-storage";
import { useLiveObraProgress } from "@/lib/use-live-obra-progress";

function getSelectedIdSnapshot(): string {
  return readProjectLibrary().selectedId ?? "";
}

function getServerEmptyId(): string {
  return "";
}

function getSelectedSnapshotSnapshot() {
  return readSelectedSnapshotJson();
}

function getServerSnapshotSnapshot() {
  return null;
}

function getProgressViewModeSnapshot(): ProgressViewMode {
  return readProgressViewMode();
}

function getServerProgressViewMode(): ProgressViewMode {
  return "after";
}

function baselineAverageFromJson(raw: string | null): number | null {
  if (!raw) {
    return null;
  }
  try {
    const model = buildSnapshotDashboard(JSON.parse(raw));
    if (!model || model.totalObjectiveTasks === 0) {
      return null;
    }
    return Math.round(
      Math.max(0, Math.min(100, model.averageProgress)),
    );
  } catch {
    return null;
  }
}

export function ObraProgressChip({
  authenticated,
}: {
  authenticated: boolean;
}) {
  const { t } = useDictionary();
  const selectedId = useSyncExternalStore(
    subscribeToProjectLibrary,
    getSelectedIdSnapshot,
    getServerEmptyId,
  );
  const snapshotJson = useSyncExternalStore(
    subscribeToProjectLibrary,
    getSelectedSnapshotSnapshot,
    getServerSnapshotSnapshot,
  );
  const mode = useSyncExternalStore(
    subscribeToProgressViewMode,
    getProgressViewModeSnapshot,
    getServerProgressViewMode,
  );
  const progress = useLiveObraProgress(
    authenticated && selectedId ? selectedId : null,
  );

  if (!hasUsableOverallProgress(progress)) {
    return null;
  }

  const beforePercent = baselineAverageFromJson(snapshotJson);
  const afterPercent = Math.round(
    Math.max(0, Math.min(100, progress.overallPercent)),
  );
  const beforeLabel =
    beforePercent === null
      ? t("nav.progressBefore")
      : t("nav.progressBeforePercent", { percent: beforePercent });
  const afterLabel = t("nav.progressAfterPercent", { percent: afterPercent });

  return (
    <Tooltip title={t("nav.progressToggleHint")}>
      <ToggleButtonGroup
        aria-label={t("nav.progressToggleHint")}
        color="primary"
        exclusive
        onChange={(_event, next: ProgressViewMode | null) => {
          if (next) {
            setProgressViewMode(next);
          }
        }}
        size="small"
        value={mode}
      >
        <ToggleButton
          aria-label={beforeLabel}
          sx={{ fontWeight: 600, px: 1.25, textTransform: "none" }}
          value="before"
        >
          {beforeLabel}
        </ToggleButton>
        <ToggleButton
          aria-label={afterLabel}
          sx={{ fontWeight: 600, px: 1.25, textTransform: "none" }}
          value="after"
        >
          {afterLabel}
        </ToggleButton>
      </ToggleButtonGroup>
    </Tooltip>
  );
}
