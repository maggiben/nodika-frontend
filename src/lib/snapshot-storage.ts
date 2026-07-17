/** In-memory project library loaded from Core via BFF. No localStorage. */

import { activateActiveProject } from "@/lib/activate-active-project";
import { redirectToLoginIfUnauthorized } from "@/lib/session-client";

export const PROJECT_LIBRARY_CHANGED_EVENT = "nodika:project-library-changed";

/** Pre-rebrand / legacy keys — cleared once so old caches do not confuse debugging. */
const LEGACY_STORAGE_KEYS = [
  "nodika.projectLibrary.v1",
  "nodika.lastSnapshotJson",
  "nordika.projectLibrary.v1",
  "nordika.lastSnapshotJson",
] as const;

export type StoredProject = {
  id: string;
  name: string;
  json: string;
  updatedAt: string;
};

export type ProjectLibrary = {
  projects: StoredProject[];
  selectedId: string | null;
};

export type ProjectLibraryRefresh = {
  library: ProjectLibrary;
  /** True when GET /api/snapshots returned HTTP 200. */
  ok: boolean;
  /** True when GET /api/snapshots returned HTTP 401. */
  unauthorized: boolean;
};

const EMPTY_LIBRARY: ProjectLibrary = {
  projects: [],
  selectedId: null,
};

let memoryLibrary: ProjectLibrary = EMPTY_LIBRARY;
let loadPromise: Promise<ProjectLibraryRefresh> | null = null;
/** Bumps when a forced refresh starts so stale in-flight GETs cannot overwrite. */
let loadGeneration = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function notifyLibraryChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(PROJECT_LIBRARY_CHANGED_EVENT));
}

function writeLibrary(library: ProjectLibrary): void {
  memoryLibrary = library;
  notifyLibraryChanged();
}

function clearLegacyLocalStorage(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    for (const key of LEGACY_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures.
  }
}

export function projectIdentityFromSnapshotJson(json: string): {
  id: string;
  name: string;
} {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) {
      return { id: `local-${Date.now()}`, name: "Untitled project" };
    }

    const meta = isRecord(parsed.meta) ? parsed.meta : {};
    const name = asString(meta.projectNombre) ?? "Untitled project";
    const projectId = asString(meta.projectId);
    if (projectId) {
      return { id: projectId, name };
    }

    return {
      id: `name:${name.toLowerCase().replace(/\s+/g, "-")}`,
      name,
    };
  } catch {
    return { id: `local-${Date.now()}`, name: "Untitled project" };
  }
}

type ListedSource = {
  id: string;
  projectId: string;
  name: string;
  filename: string;
  createdAt: string;
  content: unknown;
};

function parseListedSources(body: unknown): ListedSource[] {
  if (!Array.isArray(body)) {
    return [];
  }
  const sources: ListedSource[] = [];
  for (const entry of body) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = asString(entry.id);
    const projectId = asString(entry.projectId);
    const name = asString(entry.name);
    const filename = asString(entry.filename);
    const createdAt = asString(entry.createdAt);
    if (!id || !projectId || !name || !filename || !createdAt) {
      continue;
    }
    if (!("content" in entry)) {
      continue;
    }
    sources.push({
      id,
      projectId,
      name,
      filename,
      createdAt,
      content: entry.content,
    });
  }
  return sources;
}

function libraryFromSources(
  sources: ListedSource[],
  activeProjectId: string | null,
): ProjectLibrary {
  const projects: StoredProject[] = sources.map((source) => ({
    id: source.projectId,
    name: source.name,
    json: JSON.stringify(source.content),
    updatedAt: source.createdAt,
  }));
  const selectedId =
    activeProjectId &&
    projects.some((project) => project.id === activeProjectId)
      ? activeProjectId
      : (projects[0]?.id ?? null);
  return { projects, selectedId };
}

async function fetchActiveProjectId(): Promise<string | null> {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
    if (redirectToLoginIfUnauthorized(response)) {
      return null;
    }
    if (!response.ok) {
      return null;
    }
    const body: unknown = await response.json().catch(() => null);
    if (!isRecord(body)) {
      return null;
    }
    return asString(body.activeProjectId);
  } catch {
    return null;
  }
}

/** Load projects from Core BFF into memory. */
export async function refreshProjectLibrary(options?: {
  /** Skip joining an in-flight load (use after mutations like delete). */
  force?: boolean;
}): Promise<ProjectLibraryRefresh> {
  if (typeof window === "undefined") {
    return { library: EMPTY_LIBRARY, ok: false, unauthorized: false };
  }

  if (loadPromise && !options?.force) {
    return loadPromise;
  }

  const generation = ++loadGeneration;

  const request: Promise<ProjectLibraryRefresh> = (async (): Promise<ProjectLibraryRefresh> => {
    clearLegacyLocalStorage();
    try {
      const response = await fetch("/api/snapshots", { cache: "no-store" });
      if (redirectToLoginIfUnauthorized(response)) {
        return {
          library: EMPTY_LIBRARY,
          ok: false,
          unauthorized: true,
        };
      }
      if (!response.ok) {
        if (generation !== loadGeneration) {
          return {
            library: memoryLibrary,
            ok: false,
            unauthorized: false,
          };
        }
        writeLibrary(EMPTY_LIBRARY);
        return {
          library: EMPTY_LIBRARY,
          ok: false,
          unauthorized: false,
        };
      }
      const body: unknown = await response.json().catch(() => null);
      const sources = parseListedSources(body);
      const activeProjectId = await fetchActiveProjectId();
      const library = libraryFromSources(sources, activeProjectId);
      if (generation !== loadGeneration) {
        return { library: memoryLibrary, ok: true, unauthorized: false };
      }
      writeLibrary(library);
      return { library, ok: true, unauthorized: false };
    } catch {
      if (generation !== loadGeneration) {
        return { library: memoryLibrary, ok: false, unauthorized: false };
      }
      writeLibrary(EMPTY_LIBRARY);
      return { library: EMPTY_LIBRARY, ok: false, unauthorized: false };
    } finally {
      if (loadPromise === request) {
        loadPromise = null;
      }
    }
  })();

  loadPromise = request;
  return request;
}

export function readProjectLibrary(): ProjectLibrary {
  return memoryLibrary;
}

export function listStoredProjects(): StoredProject[] {
  return readProjectLibrary().projects;
}

export function readSelectedSnapshotJson(): string | null {
  const library = readProjectLibrary();
  if (!library.selectedId) {
    return null;
  }
  return (
    library.projects.find((project) => project.id === library.selectedId)
      ?.json ?? null
  );
}

export function selectStoredProject(projectId: string): void {
  const library = readProjectLibrary();
  if (!library.projects.some((project) => project.id === projectId)) {
    return;
  }
  writeLibrary({
    ...library,
    selectedId: projectId,
  });
}

/** After upload: set selection from snapshot identity, then refresh from Core. */
export async function activateUploadedSnapshot(
  snapshotJson: string,
  projectIdFromUpload?: string | null,
): Promise<StoredProject | null> {
  const identity = projectIdentityFromSnapshotJson(snapshotJson);
  const projectId = projectIdFromUpload?.trim() || identity.id;
  selectStoredProject(projectId);
  // Optimistically keep selection even before refresh finds it.
  if (!memoryLibrary.projects.some((project) => project.id === projectId)) {
    writeLibrary({
      projects: [
        {
          id: projectId,
          name: identity.name,
          json: snapshotJson,
          updatedAt: new Date().toISOString(),
        },
        ...memoryLibrary.projects,
      ],
      selectedId: projectId,
    });
  }
  await refreshProjectLibrary();
  selectStoredProject(projectId);
  return (
    memoryLibrary.projects.find((project) => project.id === projectId) ?? null
  );
}

export type DeleteStoredProjectResult =
  { ok: true; library: ProjectLibrary } | { ok: false; message: string };

/** Delete a project in Core by projectId, refresh library, fix active selection. */
export async function deleteStoredProject(
  projectId: string,
): Promise<DeleteStoredProjectResult> {
  const trimmed = projectId.trim();
  if (!trimmed) {
    return { ok: false, message: "Missing project id." };
  }

  if (typeof window === "undefined") {
    return { ok: false, message: "Delete is only available in the browser." };
  }

  try {
    const response = await fetch(
      `/api/snapshots/${encodeURIComponent(trimmed)}`,
      { method: "DELETE" },
    );
    if (redirectToLoginIfUnauthorized(response)) {
      return { ok: false, message: "Your session is no longer valid." };
    }
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        typeof body === "object" &&
        body !== null &&
        "message" in body &&
        typeof body.message === "string"
          ? body.message
          : "Could not delete the project.";
      return { ok: false, message };
    }

    const wasSelected = memoryLibrary.selectedId === trimmed;
    // Drop locally first so a stale in-flight list cannot keep showing it.
    writeLibrary({
      projects: memoryLibrary.projects.filter(
        (project) => project.id !== trimmed,
      ),
      selectedId:
        memoryLibrary.selectedId === trimmed ? null : memoryLibrary.selectedId,
    });

    const refresh = await refreshProjectLibrary({ force: true });
    if (!refresh.ok) {
      return {
        ok: false,
        message: "Project deleted, but the library could not be refreshed.",
      };
    }

    if (refresh.library.projects.some((project) => project.id === trimmed)) {
      return {
        ok: false,
        message: "Project is still present in Core after delete.",
      };
    }

    if (wasSelected) {
      const nextId = refresh.library.projects[0]?.id ?? null;
      const activated = await activateActiveProject(nextId);
      if (!activated.ok) {
        return { ok: false, message: activated.message };
      }
      if (nextId) {
        selectStoredProject(nextId);
      } else {
        writeLibrary({ projects: [], selectedId: null });
      }
    }

    return { ok: true, library: readProjectLibrary() };
  } catch {
    return { ok: false, message: "Could not reach the delete service." };
  }
}

export function clearStoredSnapshotJson(): void {
  memoryLibrary = EMPTY_LIBRARY;
  clearLegacyLocalStorage();
  notifyLibraryChanged();
}

export function subscribeToProjectLibrary(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onSameTabChange = () => onStoreChange();
  window.addEventListener(PROJECT_LIBRARY_CHANGED_EVENT, onSameTabChange);
  return () => {
    window.removeEventListener(PROJECT_LIBRARY_CHANGED_EVENT, onSameTabChange);
  };
}
