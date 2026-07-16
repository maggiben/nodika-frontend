import { describe, expect, test, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

vi.mock("@/lib/core-auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/core-auth")>("@/lib/core-auth");

  return {
    ...actual,
    authenticatedCoreRequest: vi.fn(),
    setSessionCookies: vi.fn((response) => response),
    clearSessionCookies: vi.fn((response) => response),
  };
});

import { authenticatedCoreRequest, CORE_ACCESS_COOKIE } from "@/lib/core-auth";

const progressPayload = {
  projectId: "obra-1",
  overallPercent: 62,
  byRole: {
    jefe_obra: 70,
    operario: 55,
    jornalero: null,
    otro: null,
  },
  reports: [],
  updatedAt: "2026-07-15T12:00:00.000Z",
};

function requestWithCookie(url: string): NextRequest {
  return new NextRequest(url, {
    method: "GET",
    headers: new Headers({ cookie: `${CORE_ACCESS_COOKIE}=token` }),
  });
}

beforeEach(() => {
  vi.mocked(authenticatedCoreRequest).mockReset();
});

describe("/api/messaging/progress", () => {
  test("returns 401 without a session", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/messaging/progress?projectId=obra-1",
      ),
    );
    expect(response.status).toBe(401);
    expect(authenticatedCoreRequest).not.toHaveBeenCalled();
  });

  test("returns 400 when projectId is missing", async () => {
    const response = await GET(
      requestWithCookie("http://localhost/api/messaging/progress"),
    );
    expect(response.status).toBe(400);
    expect(authenticatedCoreRequest).not.toHaveBeenCalled();
  });

  test("proxies Core progress for authenticated users", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify(progressPayload)),
      refreshedSession: null,
    });

    const response = await GET(
      requestWithCookie(
        "http://localhost/api/messaging/progress?projectId=obra-1",
      ),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.overallPercent).toBe(62);
    expect(authenticatedCoreRequest).toHaveBeenCalledWith(
      "/messaging/progress?projectId=obra-1",
      { method: "GET" },
      "token",
      undefined,
    );
  });
});
