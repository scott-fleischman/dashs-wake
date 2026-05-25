import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("enters and completes the electric wake gauntlet", async ({ page }) => {
  await page.goto("/");
  await seedProfile(page, {
    completedLevels: ["level_1", "level_2"],
  });
  await page.reload();

  await page.getByTestId("destination-gauntlets").click();
  await expect(page.getByRole("heading", { name: "Gauntlets" })).toBeVisible();

  await page.getByTestId("gauntlet-electric-wake-start").click();

  await expect(
    page.getByRole("dialog", { name: "Gauntlet complete" }),
  ).toBeVisible({ timeout: 15_000 });
});
