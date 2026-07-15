import { NextRequest } from "next/server";

import { proxyMessagingJson, withMessagingSession } from "@/lib/messaging-bff";

export async function GET(request: NextRequest) {
  const contactId = request.nextUrl.searchParams.get("contactId");
  const path = contactId?.trim()
    ? `/messaging/flows/runs?contactId=${encodeURIComponent(contactId.trim())}`
    : "/messaging/flows/runs";

  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(path, { method: "GET" }, accessToken, refreshToken),
  );
}
