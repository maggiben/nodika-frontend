const STORAGE_KEY = "nordika.lastSnapshotJson";

export function readStoredSnapshotJson(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function storeSnapshotJson(json: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, json);
  } catch {
    // Ignore quota / privacy-mode failures; upload already succeeded.
  }
}

export function clearStoredSnapshotJson(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
