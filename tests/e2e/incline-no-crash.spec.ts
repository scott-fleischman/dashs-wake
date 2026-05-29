import { expect, test } from "@playwright/test";
import { waitUntilPercent } from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test("does not crash while climbing the first pit ascent in Hollow Steps", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: { level_1: 100 },
    completedLevels: ["level_1"],
    unlockedLevels: ["level_2"],
  });
  await page.reload();

  await page.getByTestId("destination-official-levels").click();
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await page.getByTestId("level-2-play").click();

  await expect(
    page.getByRole("heading", { name: "Hollow Steps" }),
  ).toBeVisible();

  await waitUntilPercent(page, 22, 8_000);
  await expect(page.getByRole("dialog", { name: "Run failed" })).toBeHidden();
});
