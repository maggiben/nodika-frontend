"use client";

import { Chip, Tooltip } from "@mui/material";
import { useSyncExternalStore } from "react";

import { useDictionary } from "@/i18n/dictionary-provider";
import { hasUsableOverallProgress } from "@/lib/obra-progress";
import {
  readProjectLibrary,
  subscribeToProjectLibrary,
} from "@/lib/snapshot-storage";
import { useLiveObraProgress } from "@/lib/use-live-obra-progress";

function getSelectedIdSnapshot(): string {
  return readProjectLibrary().selectedId ?? "";
}

function getServerEmptyId(): string {
  return "";
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
  const progress = useLiveObraProgress(
    authenticated && selectedId ? selectedId : null,
  );

  if (!hasUsableOverallProgress(progress)) {
    return null;
  }

  const overall = Math.round(
    Math.max(0, Math.min(100, progress.overallPercent)),
  );
  const roleLines = [
    `${t("nav.progressRoles.jefe_obra")}: ${
      progress.byRole.jefe_obra === null
        ? "—"
        : `${Math.round(progress.byRole.jefe_obra)}%`
    }`,
    `${t("nav.progressRoles.operario")}: ${
      progress.byRole.operario === null
        ? "—"
        : `${Math.round(progress.byRole.operario)}%`
    }`,
    `${t("nav.progressRoles.jornalero")}: ${
      progress.byRole.jornalero === null
        ? "—"
        : `${Math.round(progress.byRole.jornalero)}%`
    }`,
  ].join(" · ");

  const label = t("nav.progressChip", { percent: overall });
  const description = `${label}. ${roleLines}`;

  return (
    <Tooltip title={roleLines}>
      <Chip
        aria-label={description}
        color="primary"
        label={label}
        size="small"
        sx={{ fontWeight: 600 }}
        variant="outlined"
      />
    </Tooltip>
  );
}
