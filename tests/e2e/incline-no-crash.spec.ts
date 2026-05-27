import { expect, test } from "@playwright/test";
import { waitUntilPercent } from "./helpers/course-play";
import { seedProfile } from "./helpers/profile-storage";

test("does not crash while traversing the first incline in Highline Ascent", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    bestPercents: {
      level_1: 100,
      level_2: 100,
      level_3: 100,
      level_4: 100,
      level_5: 100,
      level_6: 100,
      level_7: 100,
      level_8: 100,
    },
    completedLevels: [
      "level_1",
      "level_2",
      "level_3",
      "level_4",
      "level_5",
      "level_6",
      "level_7",
      "level_8",
    ],
    unlockedLevels: ["level_9"],
  });
  await page.reload();

  await page.getByTestId("destination-official-levels").click();
  await expect(page.getByTestId("level-9-status")).toHaveText("Unlocked");
  await page.getByTestId("level-9-play").click();

  await expect(
    page.getByRole("heading", { name: "Highline Ascent" }),
  ).toBeVisible();

  // The first ramp begins around ~14% progress in this course.
  await waitUntilPercent(page, 16, 6_000);
  await expect(page.getByRole("dialog", { name: "Run failed" })).toBeHidden();
});
