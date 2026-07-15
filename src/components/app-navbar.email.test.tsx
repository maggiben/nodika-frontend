// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TestI18n } from "@/test-utils/test-i18n";
import { AppNavbar } from "./app-navbar";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn() }),
  usePathname: () => "/es",
}));

afterEach(() => {
  cleanup();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("AppNavbar email resolution", () => {
  test("loads initials from settings when email prop is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            email: "ben.maggi@example.com",
            emailSchedule: {
              enabled: false,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      ),
    );

    render(
      <TestI18n>
        <AppNavbar authenticated />
      </TestI18n>,
    );

    expect(await screen.findByText("BE")).toBeInTheDocument();
  });
});
