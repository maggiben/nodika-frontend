// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, test, vi } from "vitest";

import {
  clearStoredSnapshotJson,
  upsertStoredProject,
} from "@/lib/snapshot-storage";
import { TestI18n } from "@/test-utils/test-i18n";
import { ProjectSelector } from "./project-selector";

vi.mock("@/lib/activate-active-project", () => ({
  activateActiveProject: vi.fn(() => Promise.resolve({ ok: true })),
}));

import { activateActiveProject } from "@/lib/activate-active-project";

afterEach(() => {
  cleanup();
  clearStoredSnapshotJson();
  window.localStorage.clear();
  vi.mocked(activateActiveProject).mockClear();
});

describe("ProjectSelector", () => {
  test("renders nothing when no projects are stored", () => {
    const { container } = render(
      <TestI18n locale="en">
        <ProjectSelector />
      </TestI18n>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  test("lists stored projects and changes selection", () => {
    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_a", projectNombre: "Alpha" },
      }),
    );
    upsertStoredProject(
      JSON.stringify({
        meta: { projectId: "proj_b", projectNombre: "Beta" },
      }),
    );

    render(
      <TestI18n locale="en">
        <ProjectSelector />
      </TestI18n>,
    );

    expect(screen.getByLabelText(/project/i)).toBeInTheDocument();
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
