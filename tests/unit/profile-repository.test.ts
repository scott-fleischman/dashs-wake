import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createProfile } from "../../src/core/profile";
import {
  loadProfile,
  saveProfile,
  PROFILE_STORAGE_KEY,
} from "../../src/persistence/profile-repository";

interface FakeStorage {
  data: Record<string, string>;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

function createFakeStorage(): FakeStorage {
  const data: Record<string, string> = {};
  return {
    data,
    getItem: (key) => (key in data ? data[key]! : null),
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
    clear: () => {
      for (const key of Object.keys(data)) {
        delete data[key];
      }
    },
  };
}

describe("profile repository", () => {
  let storage: FakeStorage;

  beforeEach(() => {
    storage = createFakeStorage();
    vi.stubGlobal("localStorage", storage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a fresh profile when storage is empty", () => {
    expect(loadProfile()).toEqual(createProfile());
  });

  it("returns a fresh profile when the stored record version mismatches", () => {
    storage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ version: 99, profile: { coins: 999 } }),
    );

    expect(loadProfile()).toEqual(createProfile());
  });

  it("returns a fresh profile when the stored data is not valid JSON", () => {
    storage.setItem(PROFILE_STORAGE_KEY, "{not-json");

    expect(loadProfile()).toEqual(createProfile());
  });

  it("merges a stored partial profile with createProfile defaults", () => {
    const partial = {
      coins: 100,
      completedLevels: ["level_1"],
    };
    storage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ version: 1, profile: partial }),
    );

    const loaded = loadProfile();

    expect(loaded.coins).toBe(100);
    expect(loaded.completedLevels).toEqual(["level_1"]);
    expect(loaded.generatedLevels).toEqual([]);
    expect(loaded.ownedCosmetics).toEqual([]);
    expect(loaded.openedChestIds).toEqual([]);
    expect(loaded.completedGauntletIds).toEqual([]);
  });

  it("roundtrips a saved profile through saveProfile and loadProfile", () => {
    const profile = {
      ...createProfile(),
      coins: 50,
      completedLevels: ["level_1"],
      keys: { easy: 1 },
    };

    saveProfile(profile);

    expect(loadProfile()).toEqual(profile);
  });
});
