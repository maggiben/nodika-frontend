import { afterEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const validSnapshot = {
  schema_version: "nodika-snapshot-v1",
  meta: {
    projectId: "proj_1",
    projectNombre: "Obra",
    ciclo_inicio: "2026-07-01",
    ciclo_fin: "2026-07-21",
    gestionSnapshotId: "snapshot_3",
    exportado_en: "2026-07-15T00:50:36.611Z",
  },
  tareas_con_objetivo: [
    {
      id: "task_1",
      label: "Estructura",
      rubroKey: null,
      ini: "2026-06-01",
      fin: "2026-07-01",
      duracion: 30,
      avance_base: 0,
      pct_objetivo: null,
      sector: null,
      agente: null,
    },
  ],
};

function createRequest(
  snapshot: unknown,
  cookies = "nodika_access_token=token; nodika_refresh_token=refresh",
) {
  return new NextRequest("http://localhost:3000/api/snapshots", {
    method: "POST",
    headers: {
      Cookie: cookies,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(snapshot),
  });
}

function createGetRequest(
  cookies = "nodika_access_token=token; nodika_refresh_token=refresh",
) {
  return new NextRequest("http://localhost:3000/api/snapshots", {
    method: "GET",
    headers: {
      Cookie: cookies,
    },
  });
}

function createRawRequest(
  body: string,
  cookies = "nodika_access_token=token; nodika_refresh_token=refresh",
) {
  return new NextRequest("http://localhost:3000/api/snapshots", {
    method: "POST",
    headers: {
      Cookie: cookies,
      "Content-Type": "application/json",
    },
    body,
  });
}

afterEach(() => {
  delete process.env.NODIKA_CORE_URL;
  vi.unstubAllGlobals();
});

describe("GET /api/snapshots", () => {
  test("lists sources from Core", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const listed = [
      {
        id: "source_1",
        projectId: "proj_1",
        name: "Obra",
        filename: "nodika-snapshot.json",
        createdAt: "2026-07-15T00:50:36.611Z",
        content: validSnapshot,
      },
    ];
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify(listed), { status: 200 }),
        ),
    );

    const response = await GET(createGetRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(listed);
  });

  test("requires authentication", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const response = await GET(createGetRequest(""));
    expect(response.status).toBe(401);
  });
});

describe("POST /api/snapshots", () => {
  test("rejects uploads when Core is not configured", async () => {
    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      message: "Snapshot uploads are not configured.",
    });
  });

  test("rejects invalid snapshots before forwarding to Core", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRawRequest("{ broken"));

    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("requires a bearer token and enforces the Core file-size limit", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";

    const unauthorized = await POST(
      createRawRequest(JSON.stringify(validSnapshot), ""),
    );
    const oversized = await POST(
      createRawRequest("x".repeat(5 * 1024 * 1024 + 1)),
    );

    expect(unauthorized.status).toBe(401);
    expect(oversized.status).toBe(413);
  });

  test("maps Core authorization failures without exposing upstream responses", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 403 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      message:
        "The Core upload token does not have permission to upload sources.",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/sources", process.env.NODIKA_CORE_URL),
      expect.objectContaining({
        headers: { Authorization: "Bearer token" },
        method: "POST",
      }),
    );
  });

  test("returns Core source details after a successful forwarding request", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            createdAt: "2026-07-15T00:50:36.611Z",
            filename: "nodika-snapshot.json",
            id: "source_1",
            projectId: "proj_1",
          }),
          { status: 201 },
        ),
      ),
    );

    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      createdAt: "2026-07-15T00:50:36.611Z",
      filename: "nodika-snapshot.json",
      id: "source_1",
      projectId: "proj_1",
    });
  });

  test("does not expose network failures", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Connection refused")),
    );

    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "Core could not be reached.",
    });
  });

  test("refreshes an expired session once and rotates cookies", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: "new-access",
            account: { email: "person@example.com" },
            refreshToken: "new-refresh",
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            createdAt: "2026-07-15T00:50:36.611Z",
            filename: "nodika-snapshot.json",
            id: "source_1",
            projectId: "proj_1",
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1]).toEqual(
      expect.objectContaining({
        headers: { Authorization: "Bearer new-access" },
      }),
    );
    expect(response.headers.get("set-cookie")).toContain(
      "nodika_access_token=new-access",
    );
  });

  test("clears the session when refresh fails", async () => {
    process.env.NODIKA_CORE_URL = "http://core.example";
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response(null, { status: 401 }))
        .mockResolvedValueOnce(new Response(null, { status: 401 })),
    );

    const response = await POST(createRequest(validSnapshot));

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
