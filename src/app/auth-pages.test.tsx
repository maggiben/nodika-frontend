// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import ForgotPasswordPage from "./forgot-password/page";
import LoginPage from "./login/page";
import RegisterPage from "./register/page";
import ResetPasswordPage from "./reset-password/page";
import VerifyEmailPage from "./verify-email/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

afterEach(cleanup);

describe("account pages", () => {
  test("render their corresponding account flows", () => {
    const pages = [
      [<LoginPage key="login" />, "Sign in"],
      [<RegisterPage key="register" />, "Create an account"],
      [<ForgotPasswordPage key="forgot-password" />, "Reset your password"],
      [<ResetPasswordPage key="reset-password" />, "Choose a new password"],
      [<VerifyEmailPage key="verify-email" />, "Verify your email"],
    ] as const;

    for (const [page, heading] of pages) {
      const view = render(page);
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
      view.unmount();
    }
  });
});
