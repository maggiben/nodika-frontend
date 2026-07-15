import { NextRequest, NextResponse } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";
import { validateFlowUpsertBody } from "@/lib/staff-message-flow";

export async function GET(request: NextRequest) {
  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/flows",
      { method: "GET" },
      accessToken,
      refreshToken,
    ),
  );
}

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  const validated = validateFlowUpsertBody(body);
  if (!validated) {
    return NextResponse.json(
      { message: "Invalid flow payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/flows",
      {
        body: JSON.stringify(validated),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      accessToken,
      refreshToken,
    ),
  );
}
