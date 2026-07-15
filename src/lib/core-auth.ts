import type { NextResponse } from "next/server";

export const CORE_ACCESS_COOKIE = "nodika_access_token";
export const CORE_REFRESH_COOKIE = "nodika_refresh_token";
export const CORE_EMAIL_COOKIE = "nodika_account_email";

type Account = Record<string, unknown>;

export type CoreSession = {
  accessToken: string;
  refreshToken: string;
  account: Account;
};

type CoreResult =
  | { ok: true; response: Response }
  | { ok: false; status: number; message: string };

const cookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: true,
};

export function getCoreUrl(): URL | null {
  const value = process.env.NODIKA_CORE_URL;

  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function safeCoreError(status: number) {
  if (status === 401) {
    return "Your session is no longer valid.";
  }

  if (status === 429) {
    return "Too many requests. Try again later.";
  }

  if (status >= 500) {
    return "Core is temporarily unavailable.";
  }

  return "Core could not complete this request.";
}

export function readCoreErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("message" in payload)) {
    return null;
  }

  const message = (payload as { message: unknown }).message;
  if (typeof message === "string" && message.trim().length > 0) {
    return message.trim();
  }

  if (
    Array.isArray(message) &&
    message.length > 0 &&
    message.every((item) => typeof item === "string")
  ) {
    return message.join(" ");
  }

  return null;
}

export async function coreRequest(
  path: string,
  init: RequestInit,
): Promise<CoreResult> {
  const coreUrl = getCoreUrl();

  if (!coreUrl) {
    return {
      ok: false,
      status: 503,
      message: "Authentication is not configured.",
    };
  }

  try {
    const response = await fetch(new URL(path, coreUrl), {
      ...init,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const payload: unknown = await response.clone().json().catch(() => null);
      const coreMessage =
        response.status < 500 ? readCoreErrorMessage(payload) : null;
      return {
        ok: false,
        status: response.status,
        message: coreMessage ?? safeCoreError(response.status),
      };
    }

    return { ok: true, response };
  } catch {
    return { ok: false, status: 502, message: "Core could not be reached." };
  }
}

export function isCoreSession(value: unknown): value is CoreSession {
  return (
    typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    "refreshToken" in value &&
    "account" in value &&
    typeof value.accessToken === "string" &&
    value.accessToken.length > 0 &&
    typeof value.refreshToken === "string" &&
    value.refreshToken.length > 0 &&
    typeof value.account === "object" &&
    value.account !== null
  );
}

export async function parseCoreSession(
  response: Response,
): Promise<CoreSession | null> {
  const payload: unknown = await response.json().catch(() => null);
  return isCoreSession(payload) ? payload : null;
}

export function readAccountEmail(account: Account): string | null {
  const email = account.email;
  return typeof email === "string" && email.trim().length > 0
    ? email.trim()
    : null;
}

export function setAccountEmailCookie(response: NextResponse, email: string) {
  response.cookies.set(CORE_EMAIL_COOKIE, email.trim(), cookieOptions);
  return response;
}

export function setSessionCookies(
  response: NextResponse,
  session: CoreSession,
) {
  response.cookies.set(CORE_ACCESS_COOKIE, session.accessToken, cookieOptions);
  response.cookies.set(
    CORE_REFRESH_COOKIE,
    session.refreshToken,
    cookieOptions,
  );

  const email = readAccountEmail(session.account);
  if (email) {
    setAccountEmailCookie(response, email);
  }

  return response;
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(CORE_ACCESS_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  response.cookies.set(CORE_REFRESH_COOKIE, "", {
    ...cookieOptions,
    maxAge: 0,
  });
  response.cookies.set(CORE_EMAIL_COOKIE, "", { ...cookieOptions, maxAge: 0 });
  return response;
}

export async function refreshSession(refreshToken: string | undefined) {
  if (!refreshToken) {
    return null;
  }

  const result = await coreRequest("/auth/refresh", {
    body: JSON.stringify({ refreshToken }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!result.ok) {
    return null;
  }

  return parseCoreSession(result.response);
}

export type EmailSchedule = {
  enabled: boolean;
  frequency: "weekly" | "monthly";
  daysOfWeek: number[];
  dayOfMonth: number;
  sendTime: string;
  timezone: string;
};

export type AccountSettings = {
  email: string;
  emailSchedule: EmailSchedule;
  nextSendDates: string[];
};

export function isAccountSettings(value: unknown): value is AccountSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const schedule = record.emailSchedule;

  return (
    typeof record.email === "string" &&
    Array.isArray(record.nextSendDates) &&
    typeof schedule === "object" &&
    schedule !== null &&
    typeof (schedule as Record<string, unknown>).enabled === "boolean" &&
    typeof (schedule as Record<string, unknown>).frequency === "string" &&
    Array.isArray((schedule as Record<string, unknown>).daysOfWeek) &&
    typeof (schedule as Record<string, unknown>).sendTime === "string"
  );
}

export async function parseAccountSettings(
  response: Response,
): Promise<AccountSettings | null> {
  const payload: unknown = await response.json().catch(() => null);
  return isAccountSettings(payload) ? payload : null;
}

export async function authenticatedCoreRequest(
  path: string,
  init: RequestInit,
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<
  | { ok: true; response: Response; refreshedSession: CoreSession | null }
  | { ok: false; status: number; message: string; refreshedSession: null }
> {
  if (!accessToken) {
    return {
      ok: false,
      status: 401,
      message: "Your session is no longer valid.",
      refreshedSession: null,
    };
  }

  let refreshedSession: CoreSession | null = null;
  let token = accessToken;

  async function send(currentToken: string) {
    return coreRequest(path, {
      ...init,
      headers: {
        ...Object.fromEntries(new Headers(init.headers).entries()),
        Authorization: `Bearer ${currentToken}`,
      },
    });
  }

  let result = await send(token);

  if (!result.ok && result.status === 401 && refreshToken) {
    refreshedSession = await refreshSession(refreshToken);
    if (!refreshedSession) {
      return {
        ok: false,
        status: 401,
        message: "Your session is no longer valid.",
        refreshedSession: null,
      };
    }
    token = refreshedSession.accessToken;
    result = await send(token);
  }

  if (!result.ok) {
    return {
      ok: false,
      status: result.status,
      message: result.message,
      refreshedSession: null,
    };
  }

  return { ok: true, response: result.response, refreshedSession };
}
