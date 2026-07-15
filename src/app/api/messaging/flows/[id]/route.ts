import { NextRequest, NextResponse } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";
import { validateFlowUpsertBody } from "@/lib/staff-message-flow";

export async function GET(
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

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/flows/${encodeURIComponent(id)}`,
      { method: "GET" },
      accessToken,
      refreshToken,
    ),
  );
}

export async function PATCH(
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
  const validated = validateFlowUpsertBody(body);
  if (!validated) {
    return NextResponse.json(
      { message: "Invalid flow payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/flows/${encodeURIComponent(id)}`,
      {
        body: JSON.stringify(validated),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      },
      accessToken,
      refreshToken,
    ),
  );
}

export async function DELETE(
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

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/flows/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      accessToken,
      refreshToken,
    ),
  );
}
