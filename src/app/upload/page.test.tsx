// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import UploadPage from "./page";

vi.mock("@/components/snapshot-upload-form", () => ({
  SnapshotUploadForm: () => <div>Snapshot upload form</div>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("UploadPage", () => {
  test("renders the snapshot upload workflow", async () => {
    render(await UploadPage());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Upload a project snapshot",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Snapshot upload form")).toBeInTheDocument();
    expect(
      screen.getByText(/Paste snapshot JSON, check syntax/),
    ).toBeInTheDocument();
  });
});
