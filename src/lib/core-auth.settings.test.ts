import { describe, expect, test, vi } from "vitest";
import {
  authenticatedCoreRequest,
  isAccountSettings,
  parseAccountSettings,
} from "./core-auth";

describe("core-auth settings helpers", () => {
  test("validates account settings payloads", () => {
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: ["2026-07-16T12:00:00.000Z"],
      }),
    ).toBe(true);
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: [],
        progressAi: { provider: "anthropic", model: "claude-sonnet-4-5" },
      }),
    ).toBe(true);
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: [],
        progressAi: {
          provider: "openai",
          model: "gpt-4o-mini",
          openaiKeyConfigured: true,
          anthropicKeyConfigured: false,
        },
      }),
    ).toBe(true);
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: [],
        progressAi: {
          provider: "openai",
          model: "gpt-4o-mini",
          openaiKeyConfigured: "yes",
        },
      }),
    ).toBe(false);
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: [],
        progressAi: {
          provider: "openai",
          model: "gpt-4o-mini",
          anthropicKeyConfigured: 1,
        },
      }),
    ).toBe(false);
    expect(
      isAccountSettings({
        email: "user@example.com",
        emailSchedule: {
          enabled: true,
          frequency: "weekly",
          daysOfWeek: [1],
          dayOfMonth: 1,
          sendTime: "09:00",
          timezone: "America/Argentina/Buenos_Aires",
        },
        nextSendDates: [],
        progressAi: { provider: "openai", model: "" },
      }),
    ).toBe(false);
    expect(isAccountSettings({ email: "user@example.com" })).toBe(false);
  });

  test("parses account settings from a response", async () => {
    const payload = {
      email: "user@example.com",
      emailSchedule: {
        enabled: false,
        frequency: "monthly",
        daysOfWeek: [1],
        dayOfMonth: 10,
        sendTime: "10:30",
        timezone: "America/Argentina/Buenos_Aires",
      },
      nextSendDates: [],
    };

    await expect(
      parseAccountSettings(new Response(JSON.stringify(payload))),
    ).resolves.toEqual(payload);
  });

  test("refreshes the session when the first authenticated request is unauthorized", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            accessToken: "next-access",
            refreshToken: "next-refresh",
            account: {
              id: "1",
              email: "user@example.com",
              emailVerified: true,
              roles: ["source_writer"],
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "user@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      );

    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODIKA_CORE_URL", "https://core.example.test");

    const result = await authenticatedCoreRequest(
      "/account/settings",
      { method: "GET" },
      "expired-access",
      "valid-refresh",
    );

    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.ok && result.refreshedSession?.accessToken).toBe(
      "next-access",
    );
  });

  test("rejects unauthenticated requests without a token", async () => {
    const result = await authenticatedCoreRequest(
      "/account/settings",
      { method: "GET" },
      undefined,
      undefined,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  test("fails when refresh cannot restore the session", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 401 }))
      .mockResolvedValueOnce(new Response("{}", { status: 401 }));

    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("NODIKA_CORE_URL", "https://core.example.test");

    const result = await authenticatedCoreRequest(
      "/account/settings",
      { method: "GET" },
      "expired-access",
      "bad-refresh",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });
});
