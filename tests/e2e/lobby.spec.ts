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
    page.getByRole("heading", { name: "First Wake" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Running");
});

test("First Wake pauses with Escape and returns to the lobby", async ({
  page,
}) => {
  await page.goto("/#play");

  await expect(
    page.getByRole("heading", { name: "First Wake" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Paused");

  await page.getByRole("button", { name: "Return to Lobby" }).click();

  await expect(page).not.toHaveURL(/#play$/);
  await expect(
    page.getByRole("heading", { name: "Dash's Wake" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page).toHaveURL(/#play$/);
  await expect(
    page.getByRole("heading", { name: "First Wake" }),
  ).toBeVisible();
});

test("First Wake ignores a second jump while the cube is airborne", async ({
  page,
}) => {
  await page.goto("/#play");

  await page.keyboard.press("Space");
  await expect(page.getByText("Jump registered")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("Airborne - jump ignored")).toBeVisible();
});

test("First Wake reports progress, restarts after failure, and can be completed", async ({
  page,
}) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const attempts = page.getByTestId("attempt-count");

  await expect(progress).toHaveText(/\d+%/);
  await expect(
    page.getByRole("dialog", { name: "Run failed" }),
  ).toBeVisible({ timeout: 3_000 });
  await expect(progress).not.toHaveText("0%");

  await page.getByRole("button", { name: "Restart" }).click();
  await expect(attempts).toHaveText("Attempt 2");

  await page.waitForTimeout(200);
  await page.keyboard.press("KeyR");
  await expect(attempts).toHaveText("Attempt 3");
  await expect(page.getByText("Restarted - 0%")).toBeVisible();

  await page.waitForTimeout(450);
  await page.keyboard.press("Space");
  await page.waitForTimeout(1_300);
  await page.keyboard.press("Space");

  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
});
