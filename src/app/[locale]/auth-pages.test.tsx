// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { TestI18n } from "@/test-utils/test-i18n";
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
  test("render their corresponding account flows in Spanish by default", () => {
    const pages = [
      [<LoginPage key="login" />, "Iniciar sesión"],
      [<RegisterPage key="register" />, "Crear una cuenta"],
      [
        <ForgotPasswordPage key="forgot-password" />,
        "Restablecer tu contraseña",
      ],
      [
        <ResetPasswordPage key="reset-password" />,
        "Elige una nueva contraseña",
      ],
      [<VerifyEmailPage key="verify-email" />, "Verifica tu correo"],
    ] as const;

    for (const [page, heading] of pages) {
      const view = render(<TestI18n>{page}</TestI18n>);
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
      view.unmount();
    }
  });
});
