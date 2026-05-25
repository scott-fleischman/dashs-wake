import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("customizer swatches reflect each cosmetic's shape variant", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    ownedCosmetics: ["icon-default", "icon-spark", "icon-pulse"],
  });
  await page.reload();

  await page.getByTestId("destination-customizer").click();

  const defaultSwatch = page.getByTestId("cosmetic-icon-default-swatch");
  const sparkSwatch = page.getByTestId("cosmetic-icon-spark-swatch");
  const pulseSwatch = page.getByTestId("cosmetic-icon-pulse-swatch");

  await expect(defaultSwatch).toHaveClass(/cosmetic-swatch/);
  await expect(defaultSwatch).not.toHaveClass(/shape-circle|shape-diamond/);
  await expect(sparkSwatch).toHaveClass(/shape-diamond/);
  await expect(pulseSwatch).toHaveClass(/shape-circle/);
});
