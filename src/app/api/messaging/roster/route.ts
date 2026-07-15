import { NextRequest } from "next/server";
import {
  proxyMessagingJson,
  withMessagingSession,
} from "@/lib/messaging-bff";

export async function GET(request: NextRequest) {
  return withMessagingSession(request, (accessToken, refreshToken) =>
    proxyMessagingJson(
      "/messaging/roster",
      { method: "GET" },
      accessToken,
      refreshToken,
    ),
  );
}
