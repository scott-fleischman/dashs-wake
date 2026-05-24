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
  await expect(
    page.getByRole("heading", { name: "Practice Lane" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Running");
});

test("practice lane pauses with Escape and returns to the lobby", async ({
  page,
}) => {
  await page.goto("/#play");

  await expect(
    page.getByRole("heading", { name: "Practice Lane" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Paused");

  await page.getByRole("button", { name: "Return to Lobby" }).click();

  await expect(page).not.toHaveURL(/#play$/);
  await expect(
    page.getByRole("heading", { name: "Dash's Wake" }),
  ).toBeVisible();
});
