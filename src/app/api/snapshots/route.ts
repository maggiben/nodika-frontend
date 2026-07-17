import { NextRequest, NextResponse } from "next/server";
import { parseNodikaSnapshot } from "@/lib/nodika-snapshot";
import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  getCoreUrl,
  setSessionCookies,
} from "@/lib/core-auth";

const maxSnapshotBytes = 5 * 1024 * 1024;

function unauthorizedResponse() {
  return clearSessionCookies(
    NextResponse.json(
      { message: "Sign in to manage snapshots." },
      { status: 401 },
    ),
  );
}

function coreErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return "Core rejected the snapshot upload.";
    case 401:
      return "The Core upload token is invalid or expired.";
    case 403:
      return "The Core upload token does not have permission to upload sources.";
    case 503:
      return "Core is temporarily unavailable.";
    case 502:
      return "Core could not be reached.";
    default:
      return "Core could not process the snapshot upload.";
  }
}

async function withSession(
  request: NextRequest,
  handler: (
    accessToken: string,
    refreshToken: string | undefined,
  ) => Promise<NextResponse>,
) {
  const accessToken = request.cookies.get(CORE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CORE_REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return unauthorizedResponse();
  }

  return handler(accessToken, refreshToken);
}

function isListedSource(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.projectId === "string" &&
    typeof record.name === "string" &&
    typeof record.filename === "string" &&
    typeof record.createdAt === "string" &&
    "content" in record
  );
}

export async function GET(request: NextRequest) {
  if (!getCoreUrl()) {
    return NextResponse.json(
      { message: "Snapshot uploads are not configured." },
      { status: 503 },
    );
  }

  return withSession(request, async (accessToken, refreshToken) => {
    const upstream = await authenticatedCoreRequest(
      "/sources",
      { method: "GET" },
      accessToken,
      refreshToken,
    );

    if (!upstream.ok) {
      if (upstream.status === 401) {
        return unauthorizedResponse();
      }
      return NextResponse.json(
        { message: upstream.message || coreErrorMessage(upstream.status) },
        { status: upstream.status },
      );
    }

    const body: unknown = await upstream.response.json().catch(() => null);
    if (!Array.isArray(body) || !body.every(isListedSource)) {
      return NextResponse.json(
        { message: "Core returned an unexpected sources response." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(body);
    return upstream.refreshedSession
      ? setSessionCookies(response, upstream.refreshedSession)
      : response;
  });
}

export async function POST(request: NextRequest) {
  const coreUrl = getCoreUrl();

  if (!coreUrl) {
    return NextResponse.json(
      { message: "Snapshot uploads are not configured." },
      { status: 503 },
    );
  }

  const snapshotJson = await request.text();

  if (new TextEncoder().encode(snapshotJson).byteLength > maxSnapshotBytes) {
    return NextResponse.json(
      { message: "The snapshot must not exceed 5 MiB." },
      { status: 413 },
    );
  }

  const validation = parseNodikaSnapshot(snapshotJson);

  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Snapshot validation failed.",
        errors: validation.errors,
      },
      { status: 400 },
    );
  }

  return withSession(request, async (accessToken, refreshToken) => {
    const formData = new FormData();
    formData.append(
      "file",
      new File([snapshotJson], "nodika-snapshot.json", {
        type: "application/json",
      }),
    );

    const upstream = await authenticatedCoreRequest(
      "/sources",
      {
        method: "POST",
        body: formData,
      },
      accessToken,
      refreshToken,
    );

    if (!upstream.ok) {
      if (upstream.status === 401) {
        return unauthorizedResponse();
      }
      return NextResponse.json(
        { message: coreErrorMessage(upstream.status) },
        {
          status:
            upstream.status >= 400 && upstream.status < 600
              ? upstream.status
              : 502,
        },
      );
    }

    const source: unknown = await upstream.response.json().catch(() => null);

    if (
      typeof source !== "object" ||
      source === null ||
      !("id" in source) ||
      !("filename" in source) ||
      !("createdAt" in source) ||
      typeof source.id !== "string" ||
      typeof source.filename !== "string" ||
      typeof source.createdAt !== "string"
    ) {
      return NextResponse.json(
        { message: "Core returned an unexpected upload response." },
        { status: 502 },
      );
    }

    const projectId =
      "projectId" in source && typeof source.projectId === "string"
        ? source.projectId
        : null;

    const response = NextResponse.json({
      id: source.id,
      filename: source.filename,
      createdAt: source.createdAt,
      projectId,
    });

    return upstream.refreshedSession
      ? setSessionCookies(response, upstream.refreshedSession)
      : response;
  });
}
