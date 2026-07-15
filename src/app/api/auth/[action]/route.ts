import { NextRequest, NextResponse } from "next/server";
import {
  CORE_REFRESH_COOKIE,
  clearSessionCookies,
  coreRequest,
  parseCoreSession,
  refreshSession,
  setSessionCookies,
} from "@/lib/core-auth";

type AuthAction =
  | "forgot-password"
  | "login"
  | "logout"
  | "refresh"
  | "register"
  | "reset-password"
  | "verify-email";

const actions: ReadonlySet<AuthAction> = new Set([
  "forgot-password",
  "login",
  "logout",
  "refresh",
  "register",
  "reset-password",
  "verify-email",
]);

function isAuthAction(action: string): action is AuthAction {
  return actions.has(action as AuthAction);
}

function invalidRequest() {
  return NextResponse.json(
    { message: "Invalid authentication request." },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasStrings(value: Record<string, unknown>, keys: string[]) {
  return keys.every(
    (key) => typeof value[key] === "string" && value[key].trim().length > 0,
  );
}

async function requestBody(request: NextRequest) {
  const value: unknown = await request.json().catch(() => null);
  return isRecord(value) ? value : null;
}

export async function POST(
  request: NextRequest,
  context: RouteContext<"/api/auth/[action]">,
) {
  const { action } = await context.params;

  if (!isAuthAction(action)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  if (action === "logout") {
    const refreshToken = request.cookies.get(CORE_REFRESH_COOKIE)?.value;

    if (refreshToken) {
      await coreRequest("/auth/logout", {
        body: JSON.stringify({ refreshToken }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
    }

    return clearSessionCookies(NextResponse.json({ ok: true }));
  }

  if (action === "refresh") {
    const session = await refreshSession(
      request.cookies.get(CORE_REFRESH_COOKIE)?.value,
    );

    if (!session) {
      return clearSessionCookies(
        NextResponse.json(
          { message: "Your session is no longer valid." },
          { status: 401 },
        ),
      );
    }

    return setSessionCookies(
      NextResponse.json({ account: session.account }),
      session,
    );
  }

  const body = await requestBody(request);

  if (!body) {
    return invalidRequest();
  }

  const requiredKeys =
    action === "login" || action === "register"
      ? ["email", "password"]
      : action === "forgot-password"
        ? ["email"]
        : action === "verify-email"
          ? ["token"]
          : ["token", "password"];

  if (!hasStrings(body, requiredKeys)) {
    return invalidRequest();
  }

  const result = await coreRequest(`/auth/${action}`, {
    body: JSON.stringify(
      Object.fromEntries(
        requiredKeys.map((key) => [
          key,
          key === "password" ? body[key] : (body[key] as string).trim(),
        ]),
      ),
    ),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message },
      { status: result.status },
    );
  }

  if (action === "login" || action === "register") {
    const session = await parseCoreSession(result.response);

    if (!session) {
      return NextResponse.json(
        { message: "Core returned an invalid authentication response." },
        { status: 502 },
      );
    }

    return setSessionCookies(
      NextResponse.json({ account: session.account }),
      session,
    );
  }

  return NextResponse.json({ ok: true });
}
