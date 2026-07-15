// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useVisibleInterval } from "./use-visible-interval";

describe("useVisibleInterval", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("ticks on interval while the document is visible", () => {
    vi.useFakeTimers();
    const onTick = vi.fn();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });

    renderHook(() => useVisibleInterval(onTick, 4_000));

    expect(onTick).not.toHaveBeenCalled();
    vi.advanceTimersByTime(4_000);
    expect(onTick).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4_000);
    expect(onTick).toHaveBeenCalledTimes(2);
  });
});
