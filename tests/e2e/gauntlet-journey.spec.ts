import { expect, test } from "@playwright/test";
import {
  hoverThroughShipPassage,
  waitUntilPercent,
} from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test("enters and completes the electric wake gauntlet", async ({ page }) => {
  await page.goto("/");
  await seedProfile(page, {
    completedLevels: ["level_1", "level_2"],
  });
  await page.reload();

  await page.getByTestId("destination-gauntlets").click();
  await expect(page.getByRole("heading", { name: "Gauntlets" })).toBeVisible();

  await page.getByTestId("gauntlet-electric-wake-start").click();

  const progress = page.getByTestId("run-progress");
  const kicker = page.locator(".first-wake-header .kicker");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect(kicker).toContainText("Stage 1 of 3");
  await page.keyboard.down("Space");
  await expect(kicker).toContainText("Stage 2 of 3", { timeout: 5_000 });
  await page.keyboard.up("Space");
  await page.waitForTimeout(100);
  await page.keyboard.down("Space");

  await expect(kicker).toContainText("Stage 3 of 3", { timeout: 5_000 });
  await page.keyboard.up("Space");
  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(10);
  await page.keyboard.press("Space");
  await waitUntilPercent(page, 43, 6_000);
  await hoverThroughShipPassage(page, 6_000);
  await page.keyboard.down("Space");

  await expect(
    page.getByRole("dialog", { name: "Gauntlet complete" }),
  ).toBeVisible({ timeout: 6_000 });
  await page.keyboard.up("Space");
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
