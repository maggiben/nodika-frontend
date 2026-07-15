const LEGACY_STORAGE_KEY = "nordika.lastSnapshotJson";
const LIBRARY_STORAGE_KEY = "nordika.projectLibrary.v1";
export const PROJECT_LIBRARY_CHANGED_EVENT = "nordika:project-library-changed";

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

let memoryLibrary: ProjectLibrary | null = null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function notifyLibraryChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(PROJECT_LIBRARY_CHANGED_EVENT));
}

function invalidateMemoryLibrary() {
  memoryLibrary = null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
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

function parseLibrary(raw: string | null): ProjectLibrary | null {
  if (!raw || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !Array.isArray(parsed.projects)) {
      return null;
    }

    const projects: StoredProject[] = [];
    for (const entry of parsed.projects) {
      if (!isRecord(entry)) {
        continue;
      }
      const id = asString(entry.id);
      const name = asString(entry.name);
      const json = asString(entry.json);
      const updatedAt = asString(entry.updatedAt);
      if (!id || !name || !json || !updatedAt) {
        continue;
      }
      projects.push({ id, name, json, updatedAt });
    }

    const selectedId = asString(parsed.selectedId);
    return {
      projects,
      selectedId:
        selectedId && projects.some((project) => project.id === selectedId)
          ? selectedId
          : (projects[0]?.id ?? null),
    };
  } catch {
    return null;
  }
}

function writeLibrary(library: ProjectLibrary): void {
  if (typeof window === "undefined") {
    return;
  }

  memoryLibrary = library;

  try {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library));
    notifyLibraryChanged();
  } catch {
    // Ignore quota / privacy-mode failures.
  }
}

function migrateLegacySnapshot(): ProjectLibrary {
  if (typeof window === "undefined") {
    return EMPTY_LIBRARY;
  }

  try {
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy || legacy.trim().length === 0) {
      return EMPTY_LIBRARY;
    }

    const identity = projectIdentityFromSnapshotJson(legacy);
    const library: ProjectLibrary = {
      projects: [
        {
          id: identity.id,
          name: identity.name,
          json: legacy,
          updatedAt: new Date().toISOString(),
        },
      ],
      selectedId: identity.id,
    };
    writeLibrary(library);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    return library;
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function readProjectLibrary(): ProjectLibrary {
  if (typeof window === "undefined") {
    return EMPTY_LIBRARY;
  }

  if (memoryLibrary !== null) {
    return memoryLibrary;
  }

  try {
    const existing = parseLibrary(
      window.localStorage.getItem(LIBRARY_STORAGE_KEY),
    );
    if (existing && existing.projects.length > 0) {
      memoryLibrary = existing;
      return existing;
    }
    const migrated = migrateLegacySnapshot();
    memoryLibrary = migrated;
    return migrated;
  } catch {
    memoryLibrary = EMPTY_LIBRARY;
    return EMPTY_LIBRARY;
  }
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

export function upsertStoredProject(json: string): StoredProject {
  const identity = projectIdentityFromSnapshotJson(json);
  const library = readProjectLibrary();
  const entry: StoredProject = {
    id: identity.id,
    name: identity.name,
    json,
    updatedAt: new Date().toISOString(),
  };
  const without = library.projects.filter((project) => project.id !== entry.id);
  const next: ProjectLibrary = {
    projects: [entry, ...without],
    selectedId: entry.id,
  };
  writeLibrary(next);
  return entry;
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

/** @deprecated Prefer upsertStoredProject for multi-project library. */
export function storeSnapshotJson(json: string): void {
  upsertStoredProject(json);
}

/** @deprecated Prefer readSelectedSnapshotJson. */
export function readStoredSnapshotJson(): string | null {
  return readSelectedSnapshotJson();
}

export function clearStoredSnapshotJson(): void {
  if (typeof window === "undefined") {
    return;
  }

  memoryLibrary = null;

  try {
    window.localStorage.removeItem(LIBRARY_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    notifyLibraryChanged();
  } catch {
    // Ignore storage failures.
  }
}

export function subscribeToProjectLibrary(
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const onCrossTabStorage = () => {
    invalidateMemoryLibrary();
    onStoreChange();
  };
  const onSameTabChange = () => onStoreChange();

  window.addEventListener("storage", onCrossTabStorage);
  window.addEventListener(PROJECT_LIBRARY_CHANGED_EVENT, onSameTabChange);
  return () => {
    window.removeEventListener("storage", onCrossTabStorage);
    window.removeEventListener(PROJECT_LIBRARY_CHANGED_EVENT, onSameTabChange);
  };
}
