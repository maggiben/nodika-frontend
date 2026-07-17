// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { SnapshotUploadForm } from "./snapshot-upload-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/en/upload",
}));

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    onChange,
    value,
    "aria-label": ariaLabel,
  }: {
    onChange: (value: string) => void;
    value: string;
    "aria-label"?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? "Snapshot JSON"}
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  ),
}));

afterEach(() => {
  cleanup();
  push.mockReset();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("SnapshotUploadForm", () => {
  test("shows JSON validation errors and prevents upload", () => {
    render(
      <TestI18n locale="en">
        <SnapshotUploadForm authenticated />
      </TestI18n>,
    );

    fireEvent.change(screen.getByLabelText("Snapshot JSON"), {
      target: { value: "{" },
    });

    expect(screen.getByText("Fix 1 JSON syntax issue(s)")).toBeInTheDocument();
    expect(screen.getByText(/Invalid JSON syntax/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validate and upload/i }),
    ).toBeDisabled();
  });

  test("uploads a valid snapshot with the browser session", async () => {
    const fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      if (url === "/api/settings" && init?.method === "PATCH") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              email: "user@example.com",
              activeProjectId: "proj_mrjbubmw_vbds9",
              emailSchedule: {
                enabled: false,
                frequency: "weekly",
                daysOfWeek: [1],
                dayOfMonth: 1,
                sendTime: "09:00",
                timezone: "UTC",
              },
              nextSendDates: [],
            }),
            { status: 200 },
          ),
        );
      }
      if (url === "/api/settings") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              email: "user@example.com",
              activeProjectId: "proj_mrjbubmw_vbds9",
              emailSchedule: {
                enabled: false,
                frequency: "weekly",
                daysOfWeek: [1],
                dayOfMonth: 1,
                sendTime: "09:00",
                timezone: "UTC",
              },
              nextSendDates: [],
            }),
            { status: 200 },
          ),
        );
      }
      if (url === "/api/snapshots" && init?.method !== "POST") {
        return Promise.resolve(
          new Response(
            JSON.stringify([
              {
                id: "source_1",
                projectId: "proj_mrjbubmw_vbds9",
                name: "Sin nombre",
                filename: "nodika-snapshot.json",
                createdAt: "2026-07-15T00:50:36.611Z",
                content: {
                  schema_version: "nodika-snapshot-v1",
                  meta: {
                    projectId: "proj_mrjbubmw_vbds9",
                    projectNombre: "Sin nombre",
                  },
                },
              },
            ]),
            { status: 200 },
          ),
        );
      }
      if (url === "/api/snapshots") {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              createdAt: "2026-07-15T00:50:36.611Z",
              filename: "nodika-snapshot.json",
              id: "source_1",
              projectId: "proj_mrjbubmw_vbds9",
            }),
            { status: 200 },
          ),
        );
      }
      return Promise.resolve(new Response("{}", { status: 404 }));
    });
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TestI18n locale="en">
        <SnapshotUploadForm authenticated />
      </TestI18n>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /validate and upload/i }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/snapshots",
        expect.objectContaining({
          body: expect.stringContaining('"nodika-snapshot-v1"'),
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            activeProjectId: "proj_mrjbubmw_vbds9",
          }),
        }),
      );
    });
    expect(window.localStorage.getItem("nodika.projectLibrary.v1")).toBeNull();
    expect(push).toHaveBeenCalledWith("/en");
    expect(screen.getByText(/Uploaded/)).toBeInTheDocument();
    expect(screen.getByText(/source_1/)).toBeInTheDocument();
  });

  test("shows a safe API error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ message: "Core is temporarily unavailable." }),
          {
            status: 503,
          },
        ),
      ),
    );
    render(
      <TestI18n locale="en">
        <SnapshotUploadForm authenticated />
      </TestI18n>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /validate and upload/i }),
    );

    expect(
      await screen.findByText("Core is temporarily unavailable."),
    ).toBeInTheDocument();
  });

  test("requires sign-in before enabling uploads", () => {
    render(
      <TestI18n locale="en">
        <SnapshotUploadForm authenticated={false} />
      </TestI18n>,
    );

    expect(
      screen.getByText(/Sign in to upload a snapshot/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validate and upload/i }),
    ).toBeDisabled();
    expect(
      screen.queryByLabelText("Core upload token"),
    ).not.toBeInTheDocument();
  });
});
