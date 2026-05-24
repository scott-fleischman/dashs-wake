import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("lobby shows zero coins and locked Level 2 with no stored profile", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("profile-coins")).toHaveText("0 Coins");
  await expect(page.getByTestId("level-2-status")).toHaveText("Locked");
  await expect(page.getByTestId("profile-keys-easy")).not.toBeVisible();
});

test("persisted profile shows best percent, completion, key, and Level 2 unlock across reload", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: { level_1: 100 },
    coins: 100,
    completedLevels: ["level_1"],
    keys: { easy: 1 },
    unlockedLevels: ["level_2"],
  });

  await page.reload();

  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
});
