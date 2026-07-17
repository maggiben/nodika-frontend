import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { DELETE } from "./route";

function createDeleteRequest(
  projectId: string,
  cookies = "nodika_access_token=token; nodika_refresh_token=refresh",
) {
  return new NextRequest(
    `http://localhost:3000/api/snapshots/${encodeURIComponent(projectId)}`,
    {
      method: "DELETE",
      headers: {
        Cookie: cookies,
      },
    },
  );
}

afterEach(() => {
  delete process.env.NODIKA_CORE_URL;
  vi.unstubAllGlobals();
});

describe("DELETE /api/snapshots/[projectId]", () => {
  test("returns 401 without a session", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const response = await DELETE(createDeleteRequest("proj_a", ""), {
      params: Promise.resolve({ projectId: "proj_a" }),
    });
    expect(response.status).toBe(401);
  });

  test("proxies Core delete and returns projectId and deletedCount", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      if (
        (url.endsWith("/sources/proj_a") || url.includes("/sources/proj_a")) &&
        init?.method === "DELETE"
      ) {
        // Core cascade clears StaffMessage / obra progress for this projectId
        // inside the same DELETE; the BFF does not call a second endpoint.
        return new Response(
          JSON.stringify({ projectId: "proj_a", deletedCount: 2 }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await DELETE(createDeleteRequest("proj_a"), {
      params: Promise.resolve({ projectId: "proj_a" }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      projectId: "proj_a",
      deletedCount: 2,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/sources\/proj_a/);
  });

  test("forwards Core 404", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ message: "Project source not found." }),
            {
              status: 404,
            },
          ),
      ),
    );

    const response = await DELETE(createDeleteRequest("missing"), {
      params: Promise.resolve({ projectId: "missing" }),
    });
    expect(response.status).toBe(404);
  });
});
