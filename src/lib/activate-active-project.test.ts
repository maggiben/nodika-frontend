import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";

import { activateActiveProject } from "./activate-active-project";

describe("activateActiveProject", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ email: "a@b.co", nextSendDates: [], emailSchedule: { enabled: false, frequency: "weekly", daysOfWeek: [1], dayOfMonth: 1, sendTime: "09:00", timezone: "UTC" }, activeProjectId: "proj_a" }), {
            status: 200,
          }),
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("PATCHes activeProjectId to /api/settings", async () => {
    const result = await activateActiveProject("proj_a");
    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "/api/settings",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ activeProjectId: "proj_a" }),
      }),
    );
  });

  test("rejects blank project ids", async () => {
    expect(await activateActiveProject("  ")).toEqual({
      ok: false,
      message: "Missing project id.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test("surfaces upstream errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ message: "nope" }), { status: 503 }),
        ),
      ),
    );
    expect(await activateActiveProject("proj_a")).toEqual({
      ok: false,
      message: "nope",
    });
  });
});
