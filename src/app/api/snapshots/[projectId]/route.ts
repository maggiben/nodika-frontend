import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  getCoreUrl,
  setSessionCookies,
} from "@/lib/core-auth";

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
    case 404:
      return "The project was not found in Core.";
    case 401:
      return "The Core session is invalid or expired.";
    case 403:
      return "The Core session does not have permission to delete sources.";
    case 503:
      return "Core is temporarily unavailable.";
    case 502:
      return "Core could not be reached.";
    default:
      return "Core could not delete the project sources.";
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  if (!getCoreUrl()) {
    return NextResponse.json(
      { message: "Snapshot uploads are not configured." },
      { status: 503 },
    );
  }

  const { projectId: rawProjectId } = await context.params;
  const projectId = decodeURIComponent(rawProjectId ?? "").trim();
  if (!projectId) {
    return NextResponse.json(
      { message: "Project id is required." },
      { status: 400 },
    );
  }

  return withSession(request, async (accessToken, refreshToken) => {
    const upstream = await authenticatedCoreRequest(
      `/sources/${encodeURIComponent(projectId)}`,
      { method: "DELETE" },
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
    if (
      typeof body !== "object" ||
      body === null ||
      !("projectId" in body) ||
      typeof body.projectId !== "string" ||
      !("deletedCount" in body) ||
      typeof body.deletedCount !== "number"
    ) {
      return NextResponse.json(
        { message: "Core returned an unexpected delete response." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      projectId: body.projectId,
      deletedCount: body.deletedCount,
    });
    return upstream.refreshedSession
      ? setSessionCookies(response, upstream.refreshedSession)
      : response;
  });
}
