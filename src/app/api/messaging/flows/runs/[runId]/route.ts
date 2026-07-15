import { NextRequest, NextResponse } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> },
) {
  const { runId } = await context.params;
  if (!runId) {
    return NextResponse.json(
      { message: "Flow run id is required." },
      { status: 400 },
    );
  }

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      `/messaging/flows/runs/${encodeURIComponent(runId)}`,
      { method: "GET" },
      accessToken,
      refreshToken,
    ),
  );
}
