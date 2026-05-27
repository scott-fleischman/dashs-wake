import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("lobby renders status, difficulty, and best percent for every official level", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: { level_1: 100, level_2: 80, level_3: 30 },
    coins: 210,
    completedLevels: ["level_1", "level_2"],
    keys: { easy: 2 },
    unlockedLevels: ["level_2", "level_3"],
  });
  await page.reload();
  await page.getByTestId("destination-official-levels").click();

  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-2-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-3-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("level-4-status")).toHaveText("Locked");
  await expect(page.getByTestId("level-5-status")).toHaveText("Locked");

  await expect(page.getByTestId("level-1-difficulty")).toHaveText("Easy");
  await expect(page.getByTestId("level-2-difficulty")).toHaveText("Easy");
  await expect(page.getByTestId("level-3-difficulty")).toHaveText("Normal");
  await expect(page.getByTestId("level-4-difficulty")).toHaveText("Normal");
  await expect(page.getByTestId("level-5-difficulty")).toHaveText("Hard");

  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-2-best-percent")).toHaveText("80%");
  await expect(page.getByTestId("level-3-best-percent")).toHaveText("30%");

  await expect(page.getByTestId("level-1-play")).toHaveText("Replay");
  await expect(page.getByTestId("level-2-play")).toHaveText("Replay");
  await expect(page.getByTestId("level-3-play")).toHaveText("Play");
  await expect(page.getByTestId("level-4-play")).toHaveText("Locked");
  await expect(page.getByTestId("level-5-play")).toHaveText("Locked");
});
