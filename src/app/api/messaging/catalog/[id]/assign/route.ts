import { NextRequest, NextResponse } from "next/server";
import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { message: "Catalog message id is required." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => ({}));
  const payload = typeof body === "object" && body !== null ? body : {};

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/catalog/${encodeURIComponent(id)}/assign`,
      {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      accessToken,
      refreshToken,
    ),
  );
}
