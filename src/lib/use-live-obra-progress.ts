"use client";

import { useEffect, useState } from "react";

import {
  fetchObraProgress,
  type ObraProgressSummary,
} from "@/lib/obra-progress";

const POLL_MS = 30_000;

export function useLiveObraProgress(
  projectId: string | null,
): ObraProgressSummary | null {
  const [progressById, setProgressById] = useState<
    Record<string, ObraProgressSummary | null>
  >({});

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;
    const id = projectId;

    async function load() {
      const next = await fetchObraProgress(id);
      if (!cancelled) {
        setProgressById((prev) => ({ ...prev, [id]: next }));
      }
    }

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [projectId]);

  if (!projectId) {
    return null;
  }
  return progressById[projectId] ?? null;
}
