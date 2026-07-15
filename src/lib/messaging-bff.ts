import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
  type CoreSession,
} from "@/lib/core-auth";

export function unauthorizedMessagingResponse() {
  return clearSessionCookies(
    NextResponse.json(
      { message: "Sign in to manage staff messaging." },
      { status: 401 },
    ),
  );
}

export async function withMessagingSession(
  request: NextRequest,
  handler: (
    accessToken: string,
    refreshToken: string | undefined,
  ) => Promise<NextResponse>,
) {
  const accessToken = request.cookies.get(CORE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CORE_REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return unauthorizedMessagingResponse();
  }

  return handler(accessToken, refreshToken);
}

export async function proxyMessagingJson(
  path: string,
  init: RequestInit,
  accessToken: string,
  refreshToken: string | undefined,
): Promise<NextResponse> {
  const upstream = await authenticatedCoreRequest(
    path,
    init,
    accessToken,
    refreshToken,
  );

  if (!upstream.ok) {
    if (upstream.status === 401) {
      return unauthorizedMessagingResponse();
    }
    return NextResponse.json(
      { message: upstream.message },
      { status: upstream.status },
    );
  }

  const payload: unknown = await upstream.response.json().catch(() => null);
  const response = NextResponse.json(payload ?? { ok: true });
  return withRefreshedCookies(response, upstream.refreshedSession);
}

function withRefreshedCookies(
  response: NextResponse,
  refreshedSession: CoreSession | null,
) {
  return refreshedSession
    ? setSessionCookies(response, refreshedSession)
    : response;
}
