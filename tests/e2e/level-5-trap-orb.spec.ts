import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("activating a trap orb crashes the run", async ({ page }) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: {
      level_1: 100,
      level_2: 100,
      level_3: 100,
      level_4: 100,
    },
    completedLevels: ["level_1", "level_2", "level_3", "level_4"],
    unlockedLevels: ["level_5"],
  });
  await page.reload();

  await expect(page.getByTestId("level-5-status")).toHaveText("Unlocked");
  await page.getByTestId("level-5-play").click();

  await expect(page.getByRole("heading", { name: "Trap Lane" })).toBeVisible();

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(5);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 10_000 })
    .toBeGreaterThanOrEqual(61);
  await page.keyboard.press("Space");

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 3_000 });
  await expect(failedDialog.locator("h2")).toHaveText("Crash");
});
