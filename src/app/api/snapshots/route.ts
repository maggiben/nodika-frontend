import { NextRequest, NextResponse } from "next/server";
import { parseNodikaSnapshot } from "@/lib/nodika-snapshot";
import {
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  coreRequest,
  getCoreUrl,
  refreshSession,
  setSessionCookies,
} from "@/lib/core-auth";

const maxSnapshotBytes = 5 * 1024 * 1024;

function unauthorizedResponse() {
  return NextResponse.json(
    { message: "Sign in to upload a snapshot." },
    { status: 401 },
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

  const formData = new FormData();
  formData.append(
    "file",
    new File([snapshotJson], "nodika-snapshot.json", {
      type: "application/json",
    }),
  );

  async function upload(accessToken: string) {
    return coreRequest("/sources", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
  }

  const accessToken = request.cookies.get(CORE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CORE_REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return clearSessionCookies(unauthorizedResponse());
  }

  let upstream = await upload(accessToken);
  let refreshedSession = null;

  if (!upstream.ok && upstream.status === 401) {
    refreshedSession = await refreshSession(refreshToken);

    if (!refreshedSession) {
      return clearSessionCookies(unauthorizedResponse());
    }

    upstream = await upload(refreshedSession.accessToken);
  }

  if (!upstream.ok) {
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

  const response = NextResponse.json({
    id: source.id,
    filename: source.filename,
    createdAt: source.createdAt,
  });

  return refreshedSession
    ? setSessionCookies(response, refreshedSession)
    : response;
}
