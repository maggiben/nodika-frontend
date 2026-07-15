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
import { AuthForm } from "./auth-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
  usePathname: () => "/en/login",
}));

afterEach(() => {
  cleanup();
  push.mockReset();
  refresh.mockReset();
  vi.unstubAllGlobals();
});

describe("AuthForm", () => {
  test("validates and submits login credentials to the BFF", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    render(
      <TestI18n locale="en">
        <AuthForm action="login" fields={["email", "password"]} />
      </TestI18n>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/auth/login",
        expect.objectContaining({
          body: JSON.stringify({
            email: "person@example.com",
            password: "secret",
          }),
          method: "POST",
        }),
      );
    });
    expect(push).toHaveBeenCalledWith("/en");
  });

  test("shows safe failures from the BFF", async () => {
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
        <AuthForm action="forgot-password" fields={["email"]} />
      </TestI18n>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/i }));

    expect(
      await screen.findByText("Core is temporarily unavailable."),
    ).toBeInTheDocument();
  });

  test("shows unreachable copy when the BFF cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(
      <TestI18n locale="en">
        <AuthForm action="login" fields={["email", "password"]} />
      </TestI18n>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText(/authentication service could not be reached/i),
    ).toBeInTheDocument();
  });

  test("shows success message for forgot-password without redirect", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    render(
      <TestI18n locale="en">
        <AuthForm action="forgot-password" fields={["email"]} />
      </TestI18n>,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send reset link/i }));

    expect(
      await screen.findByText(/you will receive email instructions/i),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
