import { expect, test } from "@playwright/test";

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
