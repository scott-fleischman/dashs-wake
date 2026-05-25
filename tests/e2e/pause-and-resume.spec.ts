import { expect, test } from "@playwright/test";

test("pause freezes the run and resume continues it", async ({ page }) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 2_000 })
    .toBeGreaterThanOrEqual(3);

  await page.keyboard.press("Escape");

  const pausedDialog = page.getByRole("dialog", { name: "Paused" });
  await expect(pausedDialog).toBeVisible();

  const frozenPercent = await readPercent();
  await page.waitForTimeout(300);
  expect(await readPercent()).toBe(frozenPercent);

  await page.keyboard.press("Escape");
  await expect(pausedDialog).toBeHidden();

  await expect
    .poll(readPercent, { intervals: [20], timeout: 2_000 })
    .toBeGreaterThan(frozenPercent);
});
