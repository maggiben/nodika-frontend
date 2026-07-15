// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AppTheme } from "./app-theme";
import { AppNavbar } from "./app-navbar";

const refresh = vi.fn();
const setMode = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@mui/material/styles", async () => {
  const actual = await vi.importActual<typeof import("@mui/material/styles")>(
    "@mui/material/styles",
  );

  return {
    ...actual,
    useColorScheme: () => ({
      mode: "light",
      setMode,
    }),
  };
});

afterEach(() => {
  cleanup();
  refresh.mockReset();
  setMode.mockReset();
  vi.unstubAllGlobals();
});

describe("AppNavbar", () => {
  test("shows sign-in and registration links when unauthenticated", () => {
    render(
      <AppTheme>
        <AppNavbar authenticated={false} />
      </AppTheme>,
    );

    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByRole("link", { name: "Register" })).toHaveAttribute(
      "href",
      "/register",
    );
    expect(
      screen.queryByRole("button", { name: "Open account menu" }),
    ).not.toBeInTheDocument();
  });

  test("opens preferences for theme changes and logout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AppTheme>
        <AppNavbar authenticated />
      </AppTheme>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(
      screen.getByRole("menuitem", { name: "Upload snapshot" }),
    ).toHaveAttribute("href", "/upload");
    fireEvent.click(screen.getByRole("menuitem", { name: "Dark theme" }));
    expect(setMode).toHaveBeenCalledWith("dark");

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
        method: "POST",
      });
    });
    expect(refresh).toHaveBeenCalled();
  });
});
