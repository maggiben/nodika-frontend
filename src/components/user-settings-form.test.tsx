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

const settingsPayload = {
  email: "maria@example.com",
  emailSchedule: {
    enabled: true,
    frequency: "weekly" as const,
    daysOfWeek: [1],
    dayOfMonth: 1,
    sendTime: "09:00",
    timezone: "America/Argentina/Buenos_Aires",
  },
  nextSendDates: [] as string[],
};

describe("UserSettingsForm", () => {
  test("loads settings without the email follow-up panel", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(settingsPayload))),
    );

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/Sesión iniciada como maria@example.com/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Correos de seguimiento/i }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Zona horaria" }),
    ).toBeInTheDocument();
  });

  test("saves the account timezone", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(settingsPayload)))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            emailSchedule: {
              ...settingsPayload.emailSchedule,
              timezone: "UTC",
            },
          }),
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByRole("heading", { name: "Zona horaria" });
    fireEvent.mouseDown(screen.getByLabelText("Zona horaria"));
    fireEvent.click(screen.getByRole("option", { name: "UTC" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar zona horaria" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ timezone: "UTC" }),
        }),
      );
    });
    expect(
      await screen.findByText(/zona horaria se guardó/i),
    ).toBeInTheDocument();
  });

  test("shows a load error when settings cannot be fetched", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ message: "Core is temporarily unavailable." }),
            { status: 503 },
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
      vi.fn().mockResolvedValue(new Response(JSON.stringify(settingsPayload))),
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

  test("supports theme, language, and password changes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(settingsPayload)))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true })));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByText(/Configuración/i);
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
      .mockResolvedValueOnce(new Response(JSON.stringify(settingsPayload)))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ message: "Invalid email or password." }),
          { status: 401 },
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

  test("saves Progress AI Anthropic key and omits blank OpenAI key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              openaiKeyConfigured: false,
              anthropicKeyConfigured: false,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "anthropic",
              model: "claude-sonnet-4-5",
              openaiKeyConfigured: false,
              anthropicKeyConfigured: true,
            },
          }),
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByRole("heading", { name: /IA para avance/i });
    fireEvent.mouseDown(screen.getByLabelText("Proveedor activo"));
    fireEvent.click(screen.getByRole("option", { name: "Anthropic" }));
    fireEvent.mouseDown(screen.getByLabelText("Modelo de Anthropic"));
    fireEvent.click(screen.getByRole("option", { name: "claude-haiku-4-5" }));
    fireEvent.change(screen.getByLabelText("Clave API de Anthropic"), {
      target: { value: "sk-ant-test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar IA de avance" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({
            progressAi: {
              provider: "anthropic",
              model: "claude-haiku-4-5",
              anthropicApiKey: "sk-ant-test",
            },
          }),
        }),
      );
    });
  });

  test("clears stored OpenAI and Anthropic keys from settings", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              openaiKeyConfigured: true,
              anthropicKeyConfigured: true,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              openaiKeyConfigured: false,
              anthropicKeyConfigured: true,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              openaiKeyConfigured: false,
              anthropicKeyConfigured: false,
            },
          }),
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByRole("button", { name: "Quitar clave de OpenAI" });
    fireEvent.click(
      screen.getByRole("button", { name: "Quitar clave de OpenAI" }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          body: JSON.stringify({
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              openaiApiKey: null,
            },
          }),
        }),
      );
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Quitar clave de Anthropic" }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          body: JSON.stringify({
            progressAi: {
              provider: "openai",
              model: "gpt-4o-mini",
              anthropicApiKey: null,
            },
          }),
        }),
      );
    });
  });

  test("saves an OpenAI key and surfaces Progress AI save errors", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o",
              openaiKeyConfigured: false,
              anthropicKeyConfigured: false,
            },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Invalid progress AI." }), {
          status: 400,
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...settingsPayload,
            progressAi: {
              provider: "openai",
              model: "gpt-4o",
              openaiKeyConfigured: true,
              anthropicKeyConfigured: false,
            },
          }),
        ),
      );

    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <UserSettingsForm />
      </TestI18n>,
    );

    await screen.findByRole("heading", { name: /IA para avance/i });
    fireEvent.change(screen.getByLabelText("Clave API de OpenAI"), {
      target: { value: "sk-openai-test" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Guardar IA de avance" }),
    );
    expect(await screen.findByText("Invalid progress AI.")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Guardar IA de avance" }),
    );
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/settings",
        expect.objectContaining({
          body: JSON.stringify({
            progressAi: {
              provider: "openai",
              model: "gpt-4o",
              openaiApiKey: "sk-openai-test",
            },
          }),
        }),
      );
    });
  });
});
