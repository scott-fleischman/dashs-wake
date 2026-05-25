import { expect, test } from "@playwright/test";

test("First Wake completes through cube and ship modes", async ({ page }) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const mode = page.getByTestId("run-mode");

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(mode).toHaveText("Cube");

  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(8);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(27);
  await page.keyboard.press("Space");

  await expect(mode).toHaveText("Ship", { timeout: 5_000 });
  await expect(mode).toHaveText("Cube", { timeout: 5_000 });

  await expect
    .poll(readPercent, { intervals: [20], timeout: 5_000 })
    .toBeGreaterThanOrEqual(61);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 4_000 })
    .toBeGreaterThanOrEqual(84);
  await page.keyboard.press("Space");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "First Wake",
  );
});
