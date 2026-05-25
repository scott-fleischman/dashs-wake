import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("chest room rows render the human-readable chest names", async ({
  page,
}) => {
  await page.goto("/");
  await seedProfile(page, {
    coins: 0,
    keys: { easy: 1, normal: 1, hard: 1 },
  });
  await page.reload();

  await page.getByTestId("destination-chest-room").click();

  await expect(page.getByText("Starter Chest", { exact: true })).toBeVisible();
  await expect(page.getByText("Wake Chest", { exact: true })).toBeVisible();
  await expect(page.getByText("Surge Chest", { exact: true })).toBeVisible();

  await expect(
    page.getByText("chest-starter", { exact: true }),
  ).toHaveCount(0);
});
