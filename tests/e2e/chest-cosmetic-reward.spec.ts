import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("opening a chest that awards a cosmetic adds it to the customizer", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 0,
    keys: { normal: 1 },
    ownedCosmetics: ["icon-default"],
  });
  await page.reload();

  await page.getByTestId("destination-chest-room").click();
  await page.getByTestId("chest-chest-normal-open").click();
  await expect(page.getByTestId("chest-chest-normal-opened")).toBeVisible();
  await page.getByRole("dialog", { name: "Chest opened" }).getByRole("button", { name: "Continue" }).click();
  await page.getByTestId("room-back").click();

  await expect(page.getByTestId("profile-coins")).toHaveText("120 Coins");

  await page.getByTestId("destination-customizer").click();
  await expect(page.getByTestId("cosmetic-icon-spark-select")).toBeVisible();
});
