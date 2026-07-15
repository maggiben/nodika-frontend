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
import { UserSettingsForm } from "./user-settings-form";

const refresh = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push }),
  usePathname: () => "/es/settings",
}));

vi.mock("@mui/material/styles", async () => {
  const actual = await vi.importActual<typeof import("@mui/material/styles")>(
    "@mui/material/styles",
  );

  const setMode = vi.fn();

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
  push.mockReset();
  vi.unstubAllGlobals();
});

describe("UserSettingsForm", () => {
  test("loads settings and saves the email schedule", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: ["2026-07-16T12:00:00.000Z"],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1, 3],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [
              "2026-07-16T12:00:00.000Z",
              "2026-07-18T12:00:00.000Z",
            ],
          }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/Sesión iniciada como maria@example.com/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mi" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar periodicidad" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(
      await screen.findByText(/periodicidad de correos se guardó/i),
    ).toBeInTheDocument();
  });

  test("shows a load error when settings cannot be fetched", async () => {
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
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    expect(
      await screen.findByText("Core is temporarily unavailable."),
    ).toBeInTheDocument();
  });

  test("validates password confirmation before submitting", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: false,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      ),
    );

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByText(/Configuración/i);
    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "old-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "new-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "different-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText(/confirmación no coincide/i),
    ).toBeInTheDocument();
  });

  test("supports monthly schedules and successful password changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "monthly",
              daysOfWeek: [1],
              dayOfMonth: 10,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: ["2026-07-16T12:00:00.000Z"],
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByLabelText("Día del mes");
    fireEvent.click(screen.getByRole("button", { name: "Tema oscuro" }));

    fireEvent.mouseDown(screen.getByLabelText("Idioma"));
    fireEvent.click(screen.getByRole("option", { name: "English" }));
    expect(push).toHaveBeenCalledWith("/en/settings");

    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "old-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "new-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "new-password-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings/change-password",
        expect.objectContaining({ method: "POST" }),
      );
    });
    expect(
      await screen.findByText(/contraseña se actualizó/i),
    ).toBeInTheDocument();
  });

  test("shows save and network errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      )
      .mockRejectedValueOnce(new Error("offline"));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByText(/Correos de seguimiento/i);
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar periodicidad" }),
    );

    expect(
      await screen.findByText(/No se pudo contactar el servicio/i),
    ).toBeInTheDocument();
  });

  test("shows API save errors and disabled schedule messaging", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: false,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Core could not complete this request." }),
          {
            status: 400,
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/No hay envíos programados/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Activar correos programados"));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar periodicidad" }),
    );

    expect(
      await screen.findByText("Core could not complete this request."),
    ).toBeInTheDocument();
  });

  test("handles initial network failures and password API errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const { unmount } = render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/No se pudo contactar el servicio/i),
    ).toBeInTheDocument();
    unmount();

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            email: "maria@example.com",
            emailSchedule: {
              enabled: true,
              frequency: "weekly",
              daysOfWeek: [1],
              dayOfMonth: 1,
              sendTime: "09:00",
              timezone: "America/Argentina/Buenos_Aires",
            },
            nextSendDates: [],
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Invalid email or password." }),
          {
            status: 401,
          },
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByText(/Configuración/i);
    fireEvent.change(screen.getByLabelText("Contraseña actual"), {
      target: { value: "old-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), {
      target: { value: "new-password-12" },
    });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "new-password-12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar contraseña" }));

    expect(
      await screen.findByText("Invalid email or password."),
    ).toBeInTheDocument();
  });
});
