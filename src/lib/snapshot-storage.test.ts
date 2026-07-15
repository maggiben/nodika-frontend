// @vitest-environment jsdom

import { afterEach, describe, expect, test, vi } from "vitest";
import {
  clearStoredSnapshotJson,
  readStoredSnapshotJson,
  storeSnapshotJson,
} from "./snapshot-storage";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("snapshot-storage", () => {
  test("stores and reads snapshot JSON", () => {
    expect(readStoredSnapshotJson()).toBeNull();

    storeSnapshotJson('{"meta":{}}');
    expect(readStoredSnapshotJson()).toBe('{"meta":{}}');

    clearStoredSnapshotJson();
    expect(readStoredSnapshotJson()).toBeNull();
  });

  test("treats blank storage as missing", () => {
    window.localStorage.setItem("nordika.lastSnapshotJson", "   ");
    expect(readStoredSnapshotJson()).toBeNull();
  });

  test("ignores localStorage failures", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readStoredSnapshotJson()).toBeNull();

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => storeSnapshotJson("{}")).not.toThrow();

    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => clearStoredSnapshotJson()).not.toThrow();
  });
});
