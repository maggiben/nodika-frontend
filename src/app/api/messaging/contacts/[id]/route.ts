import { NextRequest, NextResponse } from "next/server";
import {
  proxyMessagingJson,
  withMessagingSession,
} from "@/lib/messaging-bff";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ message: "Contact id is required." }, { status: 400 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ message: "Invalid contact payload." }, { status: 400 });
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/contacts/${encodeURIComponent(id)}`,
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
