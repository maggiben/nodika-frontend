// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { AuthForm } from "./auth-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
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
      <AuthForm
        action="login"
        fields={["email", "password"]}
        heading="Sign in"
        submitLabel="Sign in"
        successMessage=""
      />,
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
    expect(push).toHaveBeenCalledWith("/");
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
      <AuthForm
        action="forgot-password"
        fields={["email"]}
        heading="Reset your password"
        submitLabel="Send reset instructions"
        successMessage="Sent."
      />,
    );

    fireEvent.change(screen.getByLabelText("Email address"), {
      target: { value: "person@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Send reset instructions" }),
    );

    expect(
      await screen.findByText("Core is temporarily unavailable."),
    ).toBeInTheDocument();
  });
});
