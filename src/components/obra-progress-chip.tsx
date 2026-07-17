"use client";

import { ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import { useEffect, useSyncExternalStore } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { mergeDashboardWithLiveProgress } from "@/lib/merge-dashboard-live-progress";
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
  refreshProjectLibrary,
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

  useEffect(() => {
    void refreshProjectLibrary();
  }, []);

  let beforePercent: number | null = null;
  let afterPercent: number | null = null;
  let hasLiveTaskOverlay = false;
  if (snapshotJson) {
    try {
      const base = buildSnapshotDashboard(JSON.parse(snapshotJson));
      if (base && base.totalObjectiveTasks > 0) {
        beforePercent = Math.round(
          Math.max(0, Math.min(100, base.averageProgress)),
        );
        const merged = mergeDashboardWithLiveProgress(base, progress);
        hasLiveTaskOverlay = merged.usingLiveOverall;
        afterPercent = Math.round(
          Math.max(0, Math.min(100, merged.averageProgress)),
        );
      }
    } catch {
      // ignore invalid snapshot JSON
    }
  }

  // Same rule as the dashboard gauge: only show when WhatsApp task overlays
  // actually change objective-task %. Catalog-only 100% must not appear here.
  if (!hasLiveTaskOverlay || afterPercent === null) {
    return null;
  }

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
