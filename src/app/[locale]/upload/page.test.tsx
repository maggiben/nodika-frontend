// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import UploadPage from "./page";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/components/snapshot-upload-form", () => ({
  SnapshotUploadForm: () => <div>Snapshot upload form</div>,
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));

describe("UploadPage", () => {
  test("renders the snapshot upload workflow in Spanish by default", async () => {
    render(await UploadPage({ params: Promise.resolve({ locale: "es" }) }));

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Subir un snapshot de proyecto",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Snapshot upload form")).toBeInTheDocument();
    expect(screen.getByText(/Pega el JSON del snapshot/)).toBeInTheDocument();
  });

  test("rejects unsupported locales", async () => {
    await expect(
      UploadPage({ params: Promise.resolve({ locale: "fr" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
