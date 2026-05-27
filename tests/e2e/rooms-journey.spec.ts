import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("opens customizer, shop, and chest room and equips a cosmetic visible in gameplay", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 200,
    keys: { easy: 2 },
    ownedCosmetics: ["icon-default", "icon-spark"],
  });
  await page.reload();

  await page.getByTestId("destination-customizer").click();
  await expect(
    page.getByRole("heading", { name: "Icon Customizer" }),
  ).toBeVisible();
  await page.getByTestId("cosmetic-icon-spark-select").click();
  await expect(page.getByTestId("cosmetic-icon-spark-equipped")).toBeVisible();
  await page.getByTestId("room-back").click();

  await page.getByTestId("destination-shop").click();
  await expect(page.getByRole("heading", { name: "Shop" })).toBeVisible();
  await page.getByTestId("cosmetic-icon-pulse-buy").click();
  await page.getByTestId("cosmetic-icon-pulse-confirm-buy").click();
  await expect(page.getByTestId("cosmetic-icon-pulse-owned")).toBeVisible();
  await page.getByTestId("room-back").click();

  await page.getByTestId("destination-chest-room").click();
  await expect(page.getByRole("heading", { name: "Chest Room" })).toBeVisible();
  await page.getByTestId("chest-chest-starter-open").click();
  await expect(page.getByTestId("chest-chest-starter-opened")).toBeVisible();
  await page.getByRole("dialog", { name: "Chest opened" }).getByRole("button", { name: "Continue" }).click();
  await page.getByTestId("room-back").click();

  await page.getByTestId("destination-official-levels").click();
  await page.getByTestId("level-1-play").click();
  await expect(page.getByTestId("equipped-icon")).toHaveText("Spark");
});
