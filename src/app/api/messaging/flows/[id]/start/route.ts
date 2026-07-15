import { NextRequest, NextResponse } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { message: "Flow id is required." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { contactId?: unknown }).contactId !== "string" ||
    !(body as { contactId: string }).contactId.trim()
  ) {
    return NextResponse.json(
      { message: "contactId is required." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/flows/${encodeURIComponent(id)}/start`,
      {
        body: JSON.stringify({
          contactId: (body as { contactId: string }).contactId.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      accessToken,
      refreshToken,
    ),
  );
}
