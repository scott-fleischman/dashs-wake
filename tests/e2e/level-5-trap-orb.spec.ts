import { expect, test } from "@playwright/test";
import {
  hoverThroughShipPassage,
  tapAtPercents,
  waitUntilPercent,
} from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test("activating a lure orb launches the cube into visible trap spikes", async ({ page }) => {
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
  await page.getByTestId("destination-official-levels").click();

  await expect(page.getByTestId("level-5-status")).toHaveText("Unlocked");
  await page.getByTestId("level-5-play").click();

  await expect(page.getByRole("heading", { name: "Trap Lane" })).toBeVisible();

  const progress = page.getByTestId("run-progress");
  await tapAtPercents(page, [2]);
  await waitUntilPercent(page, 14);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [24, 27, 29, 36, 38]);

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 5_000 });
  await expect(failedDialog.locator("h2")).toHaveText("Crash");
});
