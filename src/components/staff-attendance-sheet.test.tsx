// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { StaffAttendanceSheet } from "@/components/staff-attendance-sheet";
import { StaffOrgChartEditor } from "@/components/staff-org-chart-editor";
import { clearAttendanceStore, getMark } from "@/lib/staff-attendance";
import { clearOrgCharts } from "@/lib/staff-org-chart";
import { TestI18n } from "@/test-utils/test-i18n";

afterEach(() => {
  cleanup();
  clearOrgCharts();
  clearAttendanceStore();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function rosterResponse(overrides?: Record<string, unknown>) {
  return [
    {
      _id: "lead_1",
      phone: "54911112222",
      label: "Juan",
      active: true,
      tags: ["staff"],
      projectIds: ["obra-1"],
      orgReports: [
        { id: "r1", name: "Ana Pérez", role: "operario" },
        { id: "r2", name: "Luis Gómez", role: "jornalero" },
      ],
      lastSentAt: null,
      lastReceivedAt: null,
      lastTemplateKey: null,
      messageTypes: [],
      hasOutbound: false,
      ...overrides,
    },
  ];
}

describe("StaffOrgChartEditor attendance link", () => {
  test("links to the attendance sheet for the same contact", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        if (url.includes("/api/snapshots")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        if (url.includes("/api/settings")) {
          return new Response(JSON.stringify({ activeProjectId: null }), {
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
      expect(
        screen.getByRole("link", { name: "Planilla de asistencia" }),
      ).toHaveAttribute("href", "/es/staff/lead_1/attendance");
    });
  });
});

describe("StaffAttendanceSheet", () => {
  test("shows team, tallies, and search filter", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        if (url.includes("/attendance")) {
          return new Response(
            JSON.stringify({
              contactId: "lead_1",
              yearMonth: "2026-07",
              marks: [
                { reportId: "r1", date: "2026-07-01", status: "full_day" },
                { reportId: "r1", date: "2026-07-02", status: "absent" },
                { reportId: "r2", date: "2026-07-01", status: "half_day" },
              ],
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <StaffAttendanceSheet contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    });
    expect(screen.getByText("Luis Gómez")).toBeInTheDocument();
    expect(screen.getByText(/Días completos: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Medias jornadas: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Faltas: 1/)).toBeInTheDocument();
    expect(
      screen.getByText(
        "La asistencia se guarda en Nodika. Las respuestas al mensaje de asistencia del equipo por WhatsApp pueden actualizar las marcas del día automáticamente.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Buscar empleado"), {
      target: { value: "Ana" },
    });

    await waitFor(() => {
      expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
      expect(screen.queryByText("Luis Gómez")).not.toBeInTheDocument();
      expect(screen.getByText(/Días completos: 1/)).toBeInTheDocument();
      expect(screen.getByText(/Medias jornadas: 0/)).toBeInTheDocument();
      expect(screen.getByText(/Faltas: 1/)).toBeInTheDocument();
    });
  });

  test("shows empty-team guidance when the chart has no reports", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/messaging/roster")) {
          return new Response(
            JSON.stringify(rosterResponse({ orgReports: [] })),
            { status: 200 },
          );
        }
        if (url.includes("/attendance")) {
          return new Response(
            JSON.stringify({
              contactId: "lead_1",
              yearMonth: "2026-07",
              marks: [],
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      }),
    );

    render(
      <TestI18n>
        <StaffAttendanceSheet contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Agregá personas en el organigrama antes de cargar asistencia.",
        ),
      ).toBeInTheDocument();
    });
    expect(getMark("lead_1", "r1", "2026-07-01")).toBeNull();
  });
});
