import { NextRequest, NextResponse } from "next/server";
import {
  authenticatedCoreRequest,
  CORE_ACCESS_COOKIE,
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from "@/lib/core-auth";

function unauthorizedResponse() {
  return clearSessionCookies(
    NextResponse.json(
      { message: "Sign in to change your password." },
      { status: 401 },
    ),
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (
    !isRecord(body) ||
    typeof body.currentPassword !== "string" ||
    typeof body.newPassword !== "string" ||
    body.currentPassword.trim().length === 0 ||
    body.newPassword.trim().length === 0
  ) {
    return NextResponse.json(
      { message: "Invalid password change request." },
      { status: 400 },
    );
  }

  const accessToken = request.cookies.get(CORE_ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(CORE_REFRESH_COOKIE)?.value;

  if (!accessToken) {
    return unauthorizedResponse();
  }

  const upstream = await authenticatedCoreRequest(
    "/account/change-password",
    {
      body: JSON.stringify({
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
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

  const response = NextResponse.json({ ok: true });
  return upstream.refreshedSession
    ? setSessionCookies(response, upstream.refreshedSession)
    : response;
}
