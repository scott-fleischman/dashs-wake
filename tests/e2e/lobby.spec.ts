import { expect, test } from "@playwright/test";
import { completeFirstWake } from "./helpers/course-play";

test("lobby presents its destinations and lets the player choose Play", async ({
  page,
}) => {
  await page.goto("/#lobby");

  await expect(
    page.getByRole("heading", { name: "Dash's Wake" }),
  ).toBeVisible();

  for (const destinationTestId of [
    "destination-customizer",
    "destination-shop",
    "destination-chest-room",
    "destination-gauntlets",
    "destination-generated-levels",
    "destination-settings",
  ]) {
    await expect(page.getByTestId(destinationTestId)).toBeEnabled();
  }

  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Official Levels" })).toBeVisible();
  await page.keyboard.press("Space");

  await expect(page).toHaveURL(/#play\/level_1$/);
  await expect(
    page.getByRole("heading", { name: "First Wake" }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Running");
  await expect(page.getByTestId("run-track")).toContainText("Dawn Circuit");
  await expect(page.getByTestId("official-level-audio")).toBeAttached();
});

test("First Wake pauses with Escape and returns to official level select", async ({
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

  await expect(page).not.toHaveURL(/#play/);
  await expect(page.getByRole("heading", { name: "Official Levels" })).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page).toHaveURL(/#play\/level_1$/);
  await expect(
    page.getByRole("heading", { name: "First Wake" }),
  ).toBeVisible();
});

test("First Wake pause and death menus support Tab plus Space", async ({
  page,
}) => {
  await page.goto("/#play");

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Paused" })).toBeVisible();
  await page.getByRole("button", { name: "Resume" }).focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Space");
  await expect(page).not.toHaveURL(/#play/);
  await expect(page.getByRole("heading", { name: "Official Levels" })).toBeVisible();

  await page.getByRole("button", { name: "Play" }).click();
  await expect(page).toHaveURL(/#play\/level_1$/);

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 3_000 });
  await page.keyboard.press("Space");
  await expect(failedDialog).toBeHidden();
  await expect(page.getByTestId("attempt-count")).toHaveText("Attempt 2");
});

test("First Wake ignores a second jump while the cube is airborne", async ({
  page,
}) => {
  await page.goto("/#play");

  await expect(
    page.getByRole("button", { name: "Jump Space / Click" }),
  ).toBeEnabled();
  await page.keyboard.press("Space");
  await expect(page.getByText("Jump registered")).toBeVisible();

  await page.keyboard.press("Space");
  await expect(page.getByText("Airborne - jump ignored")).toBeVisible();
});

test("First Wake jumps when the run surface is clicked", async ({ page }) => {
  await page.goto("/#play");

  await page.getByRole("heading", { name: "First Wake" }).click();

  await expect(page.getByText("Jump registered")).toBeVisible();
});

test("First Wake repeats cube jumps while jump is held", async ({ page }) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect.poll(readPercent, { intervals: [20] }).toBeGreaterThanOrEqual(3);
  await page.keyboard.down("Space");
  await expect
    .poll(readPercent, { intervals: [20], timeout: 4_000 })
    .toBeGreaterThanOrEqual(13);
  await page.keyboard.up("Space");

  await expect(
    page.getByRole("dialog", { name: "Run failed" }),
  ).toBeHidden();
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

  await completeFirstWake(page);
  await expect(progress).toHaveText("100%");
});
