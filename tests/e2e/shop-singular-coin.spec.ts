import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("shop balance reads '1 Coin' (singular) when the player has exactly one", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, { coins: 1 });
  await page.reload();

  await page.getByTestId("destination-shop").click();
  await expect(page.getByTestId("shop-balance")).toHaveText("1 Coin");
});
