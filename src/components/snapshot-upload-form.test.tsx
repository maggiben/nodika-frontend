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
import { SnapshotUploadForm } from "./snapshot-upload-form";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@uiw/react-codemirror", () => ({
  default: ({
    onChange,
    value,
  }: {
    onChange: (value: string) => void;
    value: string;
  }) => (
    <textarea
      aria-label="Nodika snapshot JSON"
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
    render(<SnapshotUploadForm authenticated />);

    fireEvent.change(screen.getByLabelText("Nodika snapshot JSON"), {
      target: { value: "{" },
    });

    expect(screen.getByText("Fix 1 JSON syntax issue(s)")).toBeInTheDocument();
    expect(screen.getByText(/Invalid JSON syntax/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /validate and upload/i }),
    ).toBeDisabled();
  });

  test("uploads a valid snapshot with the browser session", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          createdAt: "2026-07-15T00:50:36.611Z",
          filename: "nodika-snapshot.json",
          id: "source_1",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<SnapshotUploadForm authenticated />);
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
    expect(
      JSON.parse(
        window.localStorage.getItem("nordika.projectLibrary.v1") ?? "{}",
      ).projects[0].json,
    ).toContain("nodika-snapshot-v1");
    expect(push).toHaveBeenCalledWith("/");
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
    render(<SnapshotUploadForm authenticated />);
    fireEvent.click(
      screen.getByRole("button", { name: /validate and upload/i }),
    );

    expect(
      await screen.findByText("Core is temporarily unavailable."),
    ).toBeInTheDocument();
  });

  test("requires sign-in before enabling uploads", () => {
    render(<SnapshotUploadForm authenticated={false} />);

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
