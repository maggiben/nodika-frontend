import { NextRequest, NextResponse } from "next/server";
import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid test-send payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/test-send",
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
