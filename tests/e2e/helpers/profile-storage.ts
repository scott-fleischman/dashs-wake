import type { Page } from "@playwright/test";
import type { PlayerProfile } from "../../../src/core/profile";

export const PROFILE_STORAGE_KEY = "dashs-wake-profile-v1";

export async function seedProfile(
  page: Page,
  profile: PlayerProfile,
): Promise<void> {
  await page.evaluate(
    ([key, record]) => {
      localStorage.setItem(key, JSON.stringify(record));
    },
    [PROFILE_STORAGE_KEY, { version: 1, profile }] as const,
  );
}

export async function clearPersistedProfile(page: Page): Promise<void> {
  await page.evaluate(
    (key) => localStorage.removeItem(key),
    PROFILE_STORAGE_KEY,
  );
}
