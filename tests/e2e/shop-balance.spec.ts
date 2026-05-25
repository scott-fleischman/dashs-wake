import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("buying a cosmetic deducts coins from the shop balance immediately", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 200,
    ownedCosmetics: ["icon-default"],
  });
  await page.reload();

  await page.getByTestId("destination-shop").click();
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();
  await expect(page.getByTestId("shop-balance")).toHaveText("200 Coins");

  await page.getByTestId("cosmetic-icon-spark-buy").click();

  await expect(page.getByTestId("cosmetic-icon-spark-owned")).toBeVisible();
  await expect(page.getByTestId("shop-balance")).toHaveText("150 Coins");
});
