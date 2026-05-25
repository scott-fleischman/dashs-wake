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
    .toBeGreaterThanOrEqual(14);
  await page.keyboard.press("Space");

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Space");

  await expect(mode).toHaveText("Ship", { timeout: 5_000 });
  await expect(mode).toHaveText("Cube", { timeout: 5_000 });

  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 5_000 });
  await expect(progress).toHaveText("100%");
});
