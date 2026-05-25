import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("equipped cosmetic survives a page reload and reaches the level HUD", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    ownedCosmetics: ["icon-default", "icon-spark"],
  });
  await page.reload();

  await page.getByTestId("destination-customizer").click();
  await page.getByTestId("cosmetic-icon-spark-select").click();
  await expect(page.getByTestId("cosmetic-icon-spark-equipped")).toBeVisible();

  await page.getByTestId("room-back").click();
  await page.reload();

  await page.getByTestId("destination-customizer").click();
  await expect(page.getByTestId("cosmetic-icon-spark-equipped")).toBeVisible();
  await page.getByTestId("room-back").click();

  await expect(page.getByTestId("profile-equipped-icon")).toContainText(
    "Spark",
  );

  await page.getByTestId("level-1-play").click();
  await expect(page.getByTestId("equipped-icon")).toHaveText("Spark");
});
