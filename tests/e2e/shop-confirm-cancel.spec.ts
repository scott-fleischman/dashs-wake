import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("cancelling the purchase confirmation leaves the cosmetic unowned", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 200,
    ownedCosmetics: ["icon-default"],
  });
  await page.reload();

  await page.getByTestId("destination-shop").click();
  await page.getByTestId("cosmetic-icon-spark-buy").click();

  const confirmDialog = page.getByRole("dialog", { name: "Confirm purchase" });
  await expect(confirmDialog).toBeVisible();

  await page.getByTestId("cosmetic-icon-spark-confirm-cancel").click();

  await expect(confirmDialog).toBeHidden();
  await expect(page.getByTestId("cosmetic-icon-spark-owned")).toBeHidden();
  await expect(page.getByTestId("shop-balance")).toHaveText("200 Coins");
});
