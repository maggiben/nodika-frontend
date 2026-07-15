"use client";

import { useEffect } from "react";

/**
 * Runs `onTick` on an interval while the document is visible.
 * Pauses in background tabs to avoid wasted polling.
 */
export function useVisibleInterval(
  onTick: () => void,
  intervalMs: number,
): void {
  useEffect(() => {
    if (intervalMs <= 0) {
      return;
    }

    let timer: ReturnType<typeof setInterval> | null = null;

    const clear = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    const start = () => {
      clear();
      timer = setInterval(() => {
        if (document.visibilityState === "visible") {
          onTick();
        }
      }, intervalMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        onTick();
        start();
      } else {
        clear();
      }
    };

    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clear();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, onTick]);
}
