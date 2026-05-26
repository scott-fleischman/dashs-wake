import { expect, test } from "@playwright/test";
import { tapAtPercents } from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test.setTimeout(45_000);

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
  await tapAtPercents(page, [
    2, 4,
    13, 15,
    24, 26,
    35, 37,
    47, 49,
    60, 67,
  ]);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 10_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "Orbital Loop",
  );
});
