import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  parseAccountSettings,
  setSessionCookies,
} from "@/lib/core-auth";

function unauthorizedResponse() {
  return clearSessionCookies(
    NextResponse.json(
      { message: "Sign in to manage your settings." },
      { status: 401 },
    ),
  );
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

export async function GET(request: NextRequest) {
  return withSession(request, async (accessToken, refreshToken) => {
    const upstream = await authenticatedCoreRequest(
      "/account/settings",
      { method: "GET" },
      accessToken,
      refreshToken,
    );

    if (!upstream.ok) {
      if (upstream.status === 401) {
        return unauthorizedResponse();
      }
      return NextResponse.json(
        { message: upstream.message },
        { status: upstream.status },
      );
    }

    const settings = await parseAccountSettings(upstream.response);
    if (!settings) {
      return NextResponse.json(
        { message: "Core returned an unexpected settings response." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(settings);
    return upstream.refreshedSession
      ? setSessionCookies(response, upstream.refreshedSession)
      : response;
  });
}

export async function PATCH(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid settings request." },
      { status: 400 },
    );
  }

  return withSession(request, async (accessToken, refreshToken) => {
    const upstream = await authenticatedCoreRequest(
      "/account/settings",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
      accessToken,
      refreshToken,
    );

    if (!upstream.ok) {
      if (upstream.status === 401) {
        return unauthorizedResponse();
      }
      return NextResponse.json(
        { message: upstream.message },
        { status: upstream.status },
      );
    }

    const settings = await parseAccountSettings(upstream.response);
    if (!settings) {
      return NextResponse.json(
        { message: "Core returned an unexpected settings response." },
        { status: 502 },
      );
    }

    const response = NextResponse.json(settings);
    return upstream.refreshedSession
      ? setSessionCookies(response, upstream.refreshedSession)
      : response;
  });
}
