import { NextRequest, NextResponse } from "next/server";
import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ key: string }> },
) {
  const { key } = await context.params;
  if (!key) {
    return NextResponse.json(
      { message: "Template key is required." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid template payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/templates/${encodeURIComponent(key)}`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
      accessToken,
      refreshToken,
    ),
  );
}
