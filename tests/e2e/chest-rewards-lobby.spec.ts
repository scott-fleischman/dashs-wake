import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("opening a chest grants its reward and the lobby reflects the new balance", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 100,
    keys: { easy: 1 },
  });
  await page.reload();

  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");

  await page.getByTestId("destination-chest-room").click();
  await expect(page.getByRole("heading", { name: "Chest Room" })).toBeVisible();

  await page.getByTestId("chest-chest-starter-open").click();
  await expect(page.getByTestId("chest-chest-starter-opened")).toBeVisible();
  await expect(page.getByTestId("chest-reward-reveal")).toBeVisible();
  await expect(page.getByTestId("chest-reward-text")).toContainText("You got:");
  await page.getByRole("dialog", { name: "Chest opened" }).getByRole("button", { name: "Continue" }).click();

  await page.getByTestId("room-back").click();

  await expect(page.getByTestId("profile-coins")).toHaveText("150 Coins");
  await expect(page.getByTestId("profile-keys-easy")).not.toBeVisible();
});
