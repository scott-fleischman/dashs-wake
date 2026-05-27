import { expect, test } from "@playwright/test";
import {
  hoverThroughShipPassage,
  tapAtPercents,
  waitUntilPercent,
} from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test.setTimeout(45_000);

test("unlocks Level 4 and completes the combined run", async ({ page }) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: {
      level_1: 100,
      level_2: 100,
      level_3: 100,
    },
    completedLevels: ["level_1", "level_2", "level_3"],
    unlockedLevels: ["level_4"],
  });
  await page.reload();

  await expect(page.getByTestId("level-4-status")).toHaveText("Unlocked");
  await page.getByTestId("level-4-play").click();

  await expect(
    page.getByRole("heading", { name: "Combined Run" }),
  ).toBeVisible();

  const progress = page.getByTestId("run-progress");
  await tapAtPercents(page, [2]);
  await waitUntilPercent(page, 14);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [25, 27, 28, 29]);
  await waitUntilPercent(page, 43);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [54, 57, 59, 67]);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 10_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "Combined Run",
  );
});
