// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { StaffOrgChartEditor } from "@/components/staff-org-chart-editor";
import { StaffMessagingForm } from "@/components/staff-messaging-form";
import {
  clearOrgCharts,
  countOrgReports,
  readOrgChart,
  upsertOrgChart,
} from "@/lib/staff-org-chart";
import { TestI18n } from "@/test-utils/test-i18n";

afterEach(() => {
  cleanup();
  clearOrgCharts();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function rosterResponse() {
  return [
    {
      _id: "lead_1",
      phone: "54911112222",
      label: "Juan",
      active: true,
      tags: ["staff"],
      lastSentAt: null,
      lastReceivedAt: null,
      lastTemplateKey: null,
      messageTypes: [],
      hasOutbound: false,
    },
  ];
}

describe("StaffMessagingForm org chart actions", () => {
  test("shows Edit link and team size from local org chart", async () => {
    upsertOrgChart({
      contactId: "lead_1",
      contactLabel: "Juan",
      reports: [
        { id: "r1", name: "Ana", role: "operario" },
        { id: "r2", name: "Luis", role: "jornalero" },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        if (url.includes("/api/messaging/templates")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes("/api/messaging/catalog")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify([]), { status: 200 });
      }),
    );

    render(
      <TestI18n>
        <StaffMessagingForm />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText("Juan")).toBeInTheDocument();
    });

    const edit = screen.getByRole("link", { name: "Editar" });
    expect(edit).toHaveAttribute("href", "/es/staff/lead_1/org");
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

describe("StaffOrgChartEditor", () => {
  test("adds a report and persists it locally", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <StaffOrgChartEditor contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Juan/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar persona" }));

    await waitFor(() => {
      expect(countOrgReports("lead_1")).toBe(1);
      expect(readOrgChart("lead_1")?.reports[0]?.name).toBe("Ana");
    });
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  test("generates and copies a performance draft", async () => {
    upsertOrgChart({
      contactId: "lead_1",
      contactLabel: "Juan",
      reports: [{ id: "r1", name: "Ana", role: "operario" }],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <StaffOrgChartEditor contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Personas a cargo: 1/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Generar mensaje" }));
    expect(await screen.findByDisplayValue(/Hola Juan/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
      expect(screen.getByText("Mensaje copiado.")).toBeInTheDocument();
    });
  });

  test("shows empty-draft guidance when there are no reports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <StaffOrgChartEditor contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Juan/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Generar mensaje" }));
    expect(
      await screen.findByText(/Agregá al menos una persona/i),
    ).toBeInTheDocument();
  });

  test("shows missing lead when contact is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <StaffOrgChartEditor contactId="missing" />
      </TestI18n>,
    );

    expect(
      await screen.findByText(/No encontramos este contacto/i),
    ).toBeInTheDocument();
  });
});
