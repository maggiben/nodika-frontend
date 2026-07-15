import { NextRequest, NextResponse } from "next/server";
import {
  proxyMessagingJson,
  withMessagingSession,
} from "@/lib/messaging-bff";

export async function GET(request: NextRequest) {
  const language = request.nextUrl.searchParams.get("language");
  const path = language
    ? `/messaging/templates?language=${encodeURIComponent(language)}`
    : "/messaging/templates";

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(path, { method: "GET" }, accessToken, refreshToken),
  );
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid template payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/templates",
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      accessToken,
      refreshToken,
    ),
  );
}
