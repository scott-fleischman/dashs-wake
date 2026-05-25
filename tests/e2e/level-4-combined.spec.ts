import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

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
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(10);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 8_000 })
    .toBeGreaterThanOrEqual(82);
  await page.keyboard.press("Space");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "Combined Run",
  );
});
