import { describe, expect, test, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, PATCH } from "./route";

vi.mock("@/lib/core-auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/core-auth")>("@/lib/core-auth");

  return {
    ...actual,
    authenticatedCoreRequest: vi.fn(),
    parseAccountSettings: vi.fn(),
    setSessionCookies: vi.fn((response) => response),
  };
});

import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  parseAccountSettings,
} from "@/lib/core-auth";

const settingsPayload = {
  email: "user@example.com",
  emailSchedule: {
    enabled: true,
    frequency: "weekly" as const,
    daysOfWeek: [1],
    dayOfMonth: 1,
    sendTime: "09:00",
    timezone: "America/Argentina/Buenos_Aires",
  },
  nextSendDates: ["2026-07-16T12:00:00.000Z"],
};

function requestWithCookie(
  method: "GET" | "PATCH",
  body?: unknown,
): NextRequest {
  const init: RequestInit = {
    method,
    headers: { cookie: `${CORE_ACCESS_COOKIE}=token` },
  };

  if (body) {
    init.body = JSON.stringify(body);
    init.headers = {
      ...init.headers,
      "content-type": "application/json",
    };
  }

  return new NextRequest("http://localhost/api/settings", init);
}

beforeEach(() => {
  vi.mocked(authenticatedCoreRequest).mockReset();
  vi.mocked(parseAccountSettings).mockReset();
});

describe("/api/settings", () => {
  test("returns settings for authenticated users", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify(settingsPayload)),
      refreshedSession: null,
    });
    vi.mocked(parseAccountSettings).mockResolvedValue(settingsPayload);

    const response = await GET(requestWithCookie("GET"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.email).toBe("user@example.com");
  });

  test("updates the email schedule", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify(settingsPayload)),
      refreshedSession: null,
    });
    vi.mocked(parseAccountSettings).mockResolvedValue(settingsPayload);

    const response = await PATCH(
      requestWithCookie("PATCH", settingsPayload.emailSchedule),
    );

    expect(response.status).toBe(200);
    expect(authenticatedCoreRequest).toHaveBeenCalledWith(
      "/account/settings",
      expect.objectContaining({ method: "PATCH" }),
      "token",
      undefined,
    );
  });

  test("requires authentication", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/settings", { method: "GET" }),
    );
    expect(response.status).toBe(401);
  });

  test("rejects invalid patch bodies", async () => {
    const response = await PATCH(requestWithCookie("PATCH", "bad"));
    expect(response.status).toBe(400);
  });

  test("surfaces upstream failures", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: false,
      status: 503,
      message: "Core is temporarily unavailable.",
      refreshedSession: null,
    });

    const response = await GET(requestWithCookie("GET"));
    expect(response.status).toBe(503);
  });

  test("rejects unexpected upstream payloads", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: true,
      response: new Response("{}"),
      refreshedSession: null,
    });
    vi.mocked(parseAccountSettings).mockResolvedValue(null);

    const response = await GET(requestWithCookie("GET"));
    expect(response.status).toBe(502);
  });
});
