// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TestI18n } from "@/test-utils/test-i18n";
import { EmailFollowUpSchedulePanel } from "./email-follow-up-schedule-panel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EmailFollowUpSchedulePanel", () => {
  test("loads and saves the email schedule", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
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
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1, 3],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [
              "2026-07-16T12:00:00.000Z",
              "2026-07-18T12:00:00.000Z",
            ],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <EmailFollowUpSchedulePanel />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/Correos de seguimiento/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mi" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar periodicidad" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(
      await screen.findByText(/periodicidad de correos se guardó/i),
    ).toBeInTheDocument();
  });
});
