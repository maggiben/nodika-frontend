"use client";

import { useEffect, useState } from "react";

import {
  fetchObraProgress,
  type ObraProgressSummary,
} from "@/lib/obra-progress";
import {
  PROJECT_LIBRARY_CHANGED_EVENT,
  subscribeToProjectLibrary,
} from "@/lib/snapshot-storage";

const POLL_MS = 30_000;

export function useLiveObraProgress(
  projectId: string | null,
): ObraProgressSummary | null {
  const [progressById, setProgressById] = useState<
    Record<string, ObraProgressSummary | null>
  >({});

  useEffect(() => {
    // Drop cached live % when projects are deleted/uploaded so a re-used
    // projectId cannot briefly show the previous obra's overall progress.
    return subscribeToProjectLibrary(() => {
      setProgressById({});
    });
  }, []);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let cancelled = false;
    const id = projectId;
    setProgressById((prev) => ({ ...prev, [id]: null }));

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

    const onLibraryChanged = () => {
      void load();
    };
    window.addEventListener(PROJECT_LIBRARY_CHANGED_EVENT, onLibraryChanged);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener(
        PROJECT_LIBRARY_CHANGED_EVENT,
        onLibraryChanged,
      );
    };
  }, [projectId]);

  if (!projectId) {
    return null;
  }
  return progressById[projectId] ?? null;
}
