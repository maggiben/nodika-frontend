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
} from "@/lib/staff-org-chart";
import { TestI18n } from "@/test-utils/test-i18n";

afterEach(() => {
  cleanup();
  clearOrgCharts();
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
      orgReports: [],
      lastSentAt: null,
      lastReceivedAt: null,
      lastTemplateKey: null,
      messageTypes: [],
      hasOutbound: false,
      ...overrides,
    },
  ];
}

function mockFetch(handlers: Record<string, () => Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? "GET").toUpperCase();
      const key = `${method} ${url}`;
      for (const [pattern, handler] of Object.entries(handlers)) {
        if (key.includes(pattern) || url.includes(pattern)) {
          return handler();
        }
      }
      if (url.includes("/api/snapshots")) {
        return new Response(
          JSON.stringify([
            {
              id: "src_1",
              projectId: "obra-1",
              name: "Obra Norte",
              filename: "obra.json",
              createdAt: "2026-01-01T00:00:00.000Z",
              content: {
                meta: { projectId: "obra-1", projectNombre: "Obra Norte" },
              },
            },
            {
              id: "src_2",
              projectId: "obra-2",
              name: "Obra Sur",
              filename: "obra.json",
              createdAt: "2026-01-01T00:00:00.000Z",
              content: {
                meta: { projectId: "obra-2", projectNombre: "Obra Sur" },
              },
            },
          ]),
          { status: 200 },
        );
      }
      if (url.includes("/api/settings")) {
        return new Response(JSON.stringify({ activeProjectId: "obra-1" }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }),
  );
}

describe("StaffMessagingForm org chart actions", () => {
  test("shows Edit link and team size from Core roster orgReports", async () => {
    mockFetch({
      "/api/messaging/roster": () =>
        new Response(
          JSON.stringify(
            rosterResponse({
              orgReports: [
                { id: "r1", name: "Ana", role: "operario" },
                { id: "r2", name: "Luis", role: "jornalero" },
              ],
            }),
          ),
          { status: 200 },
        ),
      "/api/messaging/templates": () =>
        new Response(JSON.stringify([]), { status: 200 }),
      "/api/messaging/catalog": () =>
        new Response(JSON.stringify([]), { status: 200 }),
    });

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
  test("adds a report and persists it via PATCH", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
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
        if (
          method === "PATCH" &&
          url.includes("/api/messaging/contacts/lead_1")
        ) {
          const body = JSON.parse(String(init?.body ?? "{}")) as {
            orgReports: unknown[];
            projectIds: string[];
          };
          return new Response(
            JSON.stringify({
              orgReports: body.orgReports,
              projectIds: body.projectIds,
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

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
    expect(screen.getByText("Organigrama guardado.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/messaging/contacts/lead_1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  test("saves project membership via PATCH", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url.includes("/api/messaging/roster")) {
          return new Response(JSON.stringify(rosterResponse()), {
            status: 200,
          });
        }
        if (url.includes("/api/snapshots")) {
          return new Response(
            JSON.stringify([
              {
                id: "src_1",
                projectId: "obra-1",
                name: "Obra Norte",
                filename: "obra.json",
                createdAt: "2026-01-01T00:00:00.000Z",
                content: {
                  meta: { projectId: "obra-1", projectNombre: "Obra Norte" },
                },
              },
              {
                id: "src_2",
                projectId: "obra-2",
                name: "Obra Sur",
                filename: "obra.json",
                createdAt: "2026-01-01T00:00:00.000Z",
                content: {
                  meta: { projectId: "obra-2", projectNombre: "Obra Sur" },
                },
              },
            ]),
            { status: 200 },
          );
        }
        if (url.includes("/api/settings")) {
          return new Response(JSON.stringify({ activeProjectId: "obra-1" }), {
            status: 200,
          });
        }
        if (
          method === "PATCH" &&
          url.includes("/api/messaging/contacts/lead_1")
        ) {
          const body = JSON.parse(String(init?.body ?? "{}")) as {
            projectIds: string[];
          };
          return new Response(
            JSON.stringify({
              orgReports: [],
              projectIds: body.projectIds,
            }),
            { status: 200 },
          );
        }
        return new Response("{}", { status: 404 });
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <TestI18n>
        <StaffOrgChartEditor contactId="lead_1" />
      </TestI18n>,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Proyectos")).toBeInTheDocument();
    });

    fireEvent.mouseDown(screen.getByLabelText("Proyectos"));
    const obraSur = await screen.findByText(/Obra Sur/);
    fireEvent.click(obraSur);
    fireEvent.click(screen.getByRole("button", { name: "Guardar proyectos" }));

    await waitFor(() => {
      expect(readOrgChart("lead_1")?.projectIds).toEqual(
        expect.arrayContaining(["obra-1", "obra-2"]),
      );
    });
  });

  test("generates and copies a performance draft", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    mockFetch({
      "/api/messaging/roster": () =>
        new Response(
          JSON.stringify(
            rosterResponse({
              orgReports: [{ id: "r1", name: "Ana", role: "operario" }],
            }),
          ),
          { status: 200 },
        ),
    });

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
    mockFetch({
      "/api/messaging/roster": () =>
        new Response(JSON.stringify(rosterResponse()), { status: 200 }),
    });

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
    mockFetch({
      "/api/messaging/roster": () =>
        new Response(JSON.stringify([]), { status: 200 }),
    });

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
