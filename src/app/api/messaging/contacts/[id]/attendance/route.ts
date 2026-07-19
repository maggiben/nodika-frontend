import { NextRequest, NextResponse } from "next/server";
import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { message: "Contact id is required." },
      { status: 400 },
    );
  }

  const yearMonth = request.nextUrl.searchParams.get("yearMonth");
  const query =
    yearMonth && yearMonth.trim().length > 0
      ? `?yearMonth=${encodeURIComponent(yearMonth.trim())}`
      : "";

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/contacts/${encodeURIComponent(id)}/attendance${query}`,
      { method: "GET" },
      accessToken,
      refreshToken,
    ),
  );
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!id) {
    return NextResponse.json(
      { message: "Contact id is required." },
      { status: 400 },
    );
  }

  const body: unknown = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { message: "Invalid attendance payload." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/contacts/${encodeURIComponent(id)}/attendance`,
      {
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      },
      accessToken,
      refreshToken,
    ),
  );
}
