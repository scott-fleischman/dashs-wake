import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("chest-hard grants its coins and the icon-pulse cosmetic", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 0,
    keys: { hard: 1 },
    ownedCosmetics: ["icon-default"],
  });
  await page.reload();

  await expect(page.getByTestId("profile-keys-hard")).toHaveText("1 Hard Key");

  await page.getByTestId("destination-chest-room").click();
  await page.getByTestId("chest-chest-hard-open").click();
  await expect(page.getByTestId("chest-chest-hard-opened")).toBeVisible();
  await page.getByTestId("room-back").click();

  await expect(page.getByTestId("profile-coins")).toHaveText("200 Coins");
  await expect(page.getByTestId("profile-keys-hard")).toBeHidden();

  await page.getByTestId("destination-customizer").click();
  await expect(page.getByTestId("cosmetic-icon-pulse-select")).toBeVisible();
});
