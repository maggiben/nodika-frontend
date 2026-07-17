/** In-memory project library loaded from Core via BFF. No localStorage. */

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

const EMPTY_LIBRARY: ProjectLibrary = {
  projects: [],
  selectedId: null,
};

let memoryLibrary: ProjectLibrary = EMPTY_LIBRARY;
let loadPromise: Promise<ProjectLibrary> | null = null;

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
    activeProjectId && projects.some((project) => project.id === activeProjectId)
      ? activeProjectId
      : (projects[0]?.id ?? null);
  return { projects, selectedId };
}

async function fetchActiveProjectId(): Promise<string | null> {
  try {
    const response = await fetch("/api/settings", { cache: "no-store" });
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
export async function refreshProjectLibrary(): Promise<ProjectLibrary> {
  if (typeof window === "undefined") {
    return EMPTY_LIBRARY;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    clearLegacyLocalStorage();
    try {
      const response = await fetch("/api/snapshots", { cache: "no-store" });
      if (!response.ok) {
        writeLibrary(EMPTY_LIBRARY);
        return EMPTY_LIBRARY;
      }
      const body: unknown = await response.json().catch(() => null);
      const sources = parseListedSources(body);
      const activeProjectId = await fetchActiveProjectId();
      const library = libraryFromSources(sources, activeProjectId);
      writeLibrary(library);
      return library;
    } catch {
      writeLibrary(EMPTY_LIBRARY);
      return EMPTY_LIBRARY;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
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
