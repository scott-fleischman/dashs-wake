import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("unlocks Level 2 and completes the launch pad sequence", async ({
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

  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await page.getByTestId("level-2-play").click();

  await expect(
    page.getByRole("heading", { name: "Launch Sequence" }),
  ).toBeVisible();

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(14);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 6_000 })
    .toBeGreaterThanOrEqual(70);
  await page.keyboard.press("Space");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "Launch Sequence",
  );
});
