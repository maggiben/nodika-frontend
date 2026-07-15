import { NextRequest, NextResponse } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json().catch(() => null);
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as { contactId?: unknown }).contactId !== "string" ||
    !Array.isArray((body as { orderedIds?: unknown }).orderedIds)
  ) {
    return NextResponse.json(
      { message: "contactId and orderedIds are required." },
      { status: 400 },
    );
  }

  const contactId = (body as { contactId: string }).contactId.trim();
  const orderedIds = (body as { orderedIds: unknown[] }).orderedIds.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );
  if (!contactId || orderedIds.length === 0) {
    return NextResponse.json(
      { message: "contactId and orderedIds are required." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/catalog/reorder",
      {
        body: JSON.stringify({ contactId, orderedIds }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      },
      accessToken,
      refreshToken,
    ),
  );
}
