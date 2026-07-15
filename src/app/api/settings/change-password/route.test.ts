import { describe, expect, test, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@/lib/core-auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/core-auth")>("@/lib/core-auth");

  return {
    ...actual,
    authenticatedCoreRequest: vi.fn(),
    setSessionCookies: vi.fn((response) => response),
  };
});

import { authenticatedCoreRequest, CORE_ACCESS_COOKIE } from "@/lib/core-auth";

function requestWithCookie(body?: unknown): NextRequest {
  const init: RequestInit = {
    method: "POST",
    headers: { cookie: `${CORE_ACCESS_COOKIE}=token` },
  };

  if (body) {
    init.body = JSON.stringify(body);
    init.headers = {
      ...init.headers,
      "content-type": "application/json",
    };
  }

  return new NextRequest("http://localhost/api/settings/change-password", init);
}

beforeEach(() => {
  vi.mocked(authenticatedCoreRequest).mockReset();
});

describe("/api/settings/change-password", () => {
  test("rejects invalid payloads", async () => {
    const response = await POST(requestWithCookie({ currentPassword: "" }));
    expect(response.status).toBe(400);
  });

  test("proxies password changes to Core", async () => {
    vi.mocked(authenticatedCoreRequest).mockResolvedValue({
      ok: true,
      response: new Response(JSON.stringify({ ok: true })),
      refreshedSession: null,
    });

    const response = await POST(
      requestWithCookie({
        currentPassword: "old-password-12",
        newPassword: "new-password-12",
      }),
    );

    expect(response.status).toBe(200);
    expect(authenticatedCoreRequest).toHaveBeenCalledWith(
      "/account/change-password",
      expect.objectContaining({ method: "POST" }),
      "token",
      undefined,
    );
  });

  test("requires authentication", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/settings/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: "old-password-12",
          newPassword: "new-password-12",
        }),
        headers: { "content-type": "application/json" },
      }),
    );

    expect(response.status).toBe(401);
  });
});
