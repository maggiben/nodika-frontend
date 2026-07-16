export type ProgressViewMode = "before" | "after";

export const PROGRESS_VIEW_MODE_CHANGED_EVENT =
  "nodika:progress-view-mode-changed";

const STORAGE_KEY = "nodika.progressViewMode.v1";

let memoryMode: ProgressViewMode | null = null;

function isProgressViewMode(value: unknown): value is ProgressViewMode {
  return value === "before" || value === "after";
}

function notifyChanged() {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(PROGRESS_VIEW_MODE_CHANGED_EVENT));
}

export function readProgressViewMode(): ProgressViewMode {
  if (memoryMode) {
    return memoryMode;
  }
  if (typeof window === "undefined") {
    return "after";
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isProgressViewMode(raw)) {
      memoryMode = raw;
      return raw;
    }
  } catch {
    // ignore storage failures
  }
  return "after";
}

export function setProgressViewMode(mode: ProgressViewMode) {
  memoryMode = mode;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore storage failures
    }
  }
  notifyChanged();
}

export function subscribeToProgressViewMode(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const handler = () => {
    memoryMode = null;
    onStoreChange();
  };
  window.addEventListener(PROGRESS_VIEW_MODE_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(PROGRESS_VIEW_MODE_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function clearProgressViewMode() {
  memoryMode = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  notifyChanged();
}
