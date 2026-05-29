import { expect, test } from "@playwright/test";
import { seedProfile } from "./helpers/profile-storage";

test("level select can launch a reference demo playback", async ({ page }) => {
  await page.goto("/#levels");
  await expect(page.getByRole("heading", { name: "Official Levels" })).toBeVisible();

  const demoButton = page.getByTestId("level-1-demo");
  await expect(demoButton).toBeEnabled();
  await demoButton.click();

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(page.locator(".first-wake-header .kicker")).toHaveText("Reference Run");
  await expect(page.getByRole("status")).toHaveText("Demo");

  await expect
    .poll(async () => page.getByRole("status").textContent(), {
      timeout: 45_000,
    })
    .toBe("Demo complete");
});

test("exiting a demo returns to the same level in level select", async ({ page }) => {
  await page.goto("/");
  await seedProfile(page, {
    completedLevels: ["level_1"],
    unlockedLevels: ["level_2"],
  });
  await page.goto("/#levels");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("level-2-status")).toBeVisible();

  await page.getByTestId("level-2-demo").click();
  await expect(page.getByRole("heading", { name: "Hollow Steps" })).toBeVisible();

  await page.getByRole("button", { name: "Back to Levels" }).click();

  await expect(page.getByRole("heading", { name: "Official Levels" })).toBeVisible();
  await expect(page).toHaveURL(/#levels\/level_2$/);
  await expect(page.getByTestId("level-2-status")).toBeVisible();
  await expect(page.locator(".level-dot.active")).toHaveAttribute(
    "aria-label",
    "View Hollow Steps",
  );
});
