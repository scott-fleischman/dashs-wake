import { expect, test } from "@playwright/test";

test("lobby presents its destinations and lets the player choose Play", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Dash's Wake" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  for (const destination of [
    "Generated Levels",
    "Gauntlets",
    "Chest Room",
    "Shop",
    "Icon Customizer",
    "Settings",
  ]) {
    await expect(
      page.getByRole("button", {
        name: `${destination} - Coming later`,
      }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: "Play" }).click();

  await expect(page).toHaveURL(/#play$/);
  await expect(page.getByRole("status")).toContainText("Play selected");
});
