// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import { clearStoredSnapshotJson } from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ProjectSelector } from "./project-selector";

vi.mock("@/lib/activate-active-project", () => ({
  activateActiveProject: vi.fn(() => Promise.resolve({ ok: true })),
}));

import { activateActiveProject } from "@/lib/activate-active-project";

function stubTwoProjects() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo) => {
      const url = String(input);
      if (url.includes("/api/snapshots")) {
        return new Response(
          JSON.stringify([
            {
              id: "src_b",
              projectId: "proj_b",
              name: "Beta",
              filename: "b.json",
              createdAt: "2026-02-01T00:00:00.000Z",
              content: { meta: { projectId: "proj_b", projectNombre: "Beta" } },
            },
            {
              id: "src_a",
              projectId: "proj_a",
              name: "Alpha",
              filename: "a.json",
              createdAt: "2026-01-01T00:00:00.000Z",
              content: { meta: { projectId: "proj_a", projectNombre: "Alpha" } },
            },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/api/settings")) {
        return new Response(
          JSON.stringify({
            email: "a@b.co",
            activeProjectId: "proj_b",
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
        );
      }
      return new Response("{}", { status: 404 });
    }),
  );
}

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.mocked(activateActiveProject).mockClear();
  vi.unstubAllGlobals();
});

describe("ProjectSelector", () => {
  test("renders nothing when no projects are stored", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );
    const { container } = render(
      <TestI18n locale="en">
        <ProjectSelector />
      </TestI18n>,
    );
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  test("lists Core projects and changes selection", async () => {
    stubTwoProjects();

    render(
      <TestI18n locale="en">
        <ProjectSelector />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Beta")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByRole("option", { name: "Alpha" }));
    expect(activateActiveProject).toHaveBeenCalledWith("proj_a");
  });

  test("uses empty server snapshots during SSR", () => {
    const html = renderToString(
      <TestI18n locale="en">
        <ProjectSelector />
      </TestI18n>,
    );
    expect(html).toBe("");
  });
});
