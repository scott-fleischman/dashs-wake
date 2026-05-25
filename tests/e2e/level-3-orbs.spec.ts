import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("unlocks Level 3 and completes the safe orb sequence", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: { level_1: 100, level_2: 100 },
    coins: 200,
    completedLevels: ["level_1", "level_2"],
    keys: { easy: 2 },
    unlockedLevels: ["level_2", "level_3"],
  });
  await page.reload();

  await expect(page.getByTestId("level-3-status")).toHaveText("Unlocked");
  await page.getByTestId("level-3-play").click();

  await expect(
    page.getByRole("heading", { name: "Orbital Loop" }),
  ).toBeVisible();

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(8);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 5_000 })
    .toBeGreaterThanOrEqual(27);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 6_000 })
    .toBeGreaterThanOrEqual(47);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 6_000 })
    .toBeGreaterThanOrEqual(64);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 6_000 })
    .toBeGreaterThanOrEqual(86);
  await page.keyboard.press("Space");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "Orbital Loop",
  );
});
