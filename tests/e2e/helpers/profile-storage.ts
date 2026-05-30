import type { Page } from "@playwright/test";
import { createProfile, type PlayerProfile } from "../../../src/core/profile";

export const PROFILE_STORAGE_KEY = "dashs-wake-profile-v1";

export async function seedProfile(
  page: Page,
  partial: Partial<PlayerProfile>,
): Promise<void> {
  const profile: PlayerProfile = { ...createProfile(), ...partial };
  await page.evaluate(
    ([key, record]) => {
      localStorage.setItem(key, JSON.stringify(record));
    },
    [PROFILE_STORAGE_KEY, { version: 1, profile }] as const,
  );
  // Profile is read once at module boot; reload so the app picks up the seed.
  await page.reload();
}

export async function clearPersistedProfile(page: Page): Promise<void> {
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    PROFILE_STORAGE_KEY,
  );
}
