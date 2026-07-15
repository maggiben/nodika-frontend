import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

function createRequest(action: string, body?: unknown, cookie?: string) {
  return new NextRequest(`http://localhost:3000/api/auth/${action}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    method: "POST",
  });
}

function context(action: string) {
  return {
    params: Promise.resolve({ action }),
  } as RouteContext<"/api/auth/[action]">;
}

afterEach(() => {
  delete process.env.NODIKA_CORE_URL;
  vi.unstubAllGlobals();
});

describe("POST /api/auth/[action]", () => {
  test("stores login tokens only in secure HttpOnly cookies", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: "access-secret",
            account: { email: "person@example.com" },
            refreshToken: "refresh-secret",
          }),
        ),
      ),
    );

    const response = await POST(
      createRequest("login", {
        email: "person@example.com",
        password: "secret",
      }),
      context("login"),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      account: { email: "person@example.com" },
    });
    expect(JSON.stringify(body)).not.toContain("access-secret");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
  });

  test("rejects malformed credentials without calling Core", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(
      createRequest("login", { email: "person@example.com" }),
      context("login"),
    );

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("rotates cookies after a successful refresh", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            accessToken: "next-access",
            account: { email: "person@example.com" },
            refreshToken: "next-refresh",
          }),
        ),
      ),
    );

    const response = await POST(
      createRequest("refresh", undefined, "nodika_refresh_token=old-refresh"),
      context("refresh"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      "nodika_access_token=next-access",
    );
    expect(response.headers.get("set-cookie")).toContain(
      "nodika_refresh_token=next-refresh",
    );
  });

  test("clears cookies on logout even if Core is unavailable", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await POST(
      createRequest("logout", undefined, "nodika_refresh_token=refresh"),
      context("logout"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
