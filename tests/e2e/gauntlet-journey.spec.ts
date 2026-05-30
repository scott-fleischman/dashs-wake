import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test.setTimeout(120_000);

test("enters and completes the electric wake gauntlet", async ({ page }) => {
  await page.goto("/#gauntlets");
  await seedProfile(page, {
    completedLevels: ["level_1", "level_2"],
    // The Electric Wake stages are full-length cube courses that auto-clear
    // (ramps + launch pads need no input); 3x speed keeps the journey brisk.
    settings: { levelColor: "neon", speedMultiplier: 3 },
  });
  await page.reload();

  await expect(page.getByRole("heading", { name: "Gauntlets" })).toBeVisible();

  await page.getByTestId("gauntlet-electric-wake-start").click();

  const kicker = page.locator(".first-wake-header .kicker");

  // Each stage advances on its own once it auto-clears; no input required.
  await expect(kicker).toContainText("Stage 1 of 3");
  await expect(kicker).toContainText("Stage 2 of 3", { timeout: 30_000 });
  await expect(kicker).toContainText("Stage 3 of 3", { timeout: 30_000 });

  await expect(
    page.getByRole("dialog", { name: "Gauntlet complete" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("gauntlet-complete-reward")).toHaveText(
    "Earned: 150 Coins + 1 Hard Key",
  );

  await page.getByTestId("gauntlet-complete-acknowledge").click();
  await expect(page.getByTestId("gauntlet-electric-wake-status")).toHaveText(
    "Cleared",
  );

  await page.getByTestId("room-back").click();
  await expect(page.getByTestId("profile-coins")).toHaveText("150 Coins");
});
