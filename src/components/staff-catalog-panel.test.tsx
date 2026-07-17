// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { StaffCatalogPanel } from "@/components/staff-catalog-panel";
import { clearOrgCharts, upsertOrgChart } from "@/lib/staff-org-chart";
import { TestI18n } from "@/test-utils/test-i18n";

afterEach(() => {
  cleanup();
  clearOrgCharts();
  window.localStorage.clear();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("StaffCatalogPanel message presets", () => {
  test("prefills the create form from the selected lead org chart", async () => {
    upsertOrgChart({
      contactId: "lead_1",
      contactLabel: "Juan",
      projectIds: [],
      reports: [
        { id: "r1", name: "Ana", role: "operario" },
        { id: "r2", name: "Luis", role: "jornalero" },
      ],
      updatedAt: "2026-01-01T00:00:00.000Z",
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <StaffCatalogPanel
          roster={[
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
          ]}
        />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Mensaje predefinido")).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText("Asignar a…"));
    fireEvent.click(await screen.findByRole("option", { name: "Juan" }));
    fireEvent.mouseDown(screen.getByLabelText("Mensaje predefinido"));
    fireEvent.click(
      await screen.findByRole("option", { name: "Asistencia del equipo" }),
    );

    expect(
      await screen.findByDisplayValue(/Asistencia del equipo — Juan/),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(/1\. Ana \(operario\)/),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Día completo/)).toBeInTheDocument();
    expect(screen.getByText(/personas del organigrama/i)).toBeInTheDocument();
  });

  test("applies work-progress preset fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify([]), { status: 200 })),
    );

    render(
      <TestI18n>
        <StaffCatalogPanel roster={[]} />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Mensaje predefinido")).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText("Mensaje predefinido"));
    fireEvent.click(
      await screen.findByRole("option", {
        name: "Avance (%, duración, notas)",
      }),
    );

    expect(
      await screen.findByDisplayValue(/Avance de jornada/),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Porcentaje cumplido/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Duración/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(/Tiempo de trabajo/)).toBeInTheDocument();
  });
});
