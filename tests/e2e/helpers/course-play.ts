import { expect, type Page } from "@playwright/test";

export async function waitUntilPercent(
  page: Page,
  percent: number,
  timeout = 8_000,
): Promise<void> {
  const progress = page.getByTestId("run-progress");
  await expect
    .poll(
      async () => Number((await progress.textContent())?.replace("%", "")),
      { intervals: [20], timeout },
    )
    .toBeGreaterThanOrEqual(percent);
}

export async function tapAtPercents(
  page: Page,
  percents: readonly number[],
  timeout = 8_000,
): Promise<void> {
  for (const percent of percents) {
    await waitUntilPercent(page, percent, timeout);
    await page.keyboard.press("Space");
  }
}

export async function completeFirstWake(page: Page): Promise<void> {
  await hoverThroughShipPassage(page);
  await waitUntilPercent(page, 32);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [69]);
  await waitUntilPercent(page, 74);
  await page.keyboard.down("Space");
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 8_000 });
  await page.keyboard.up("Space");
}

export async function hoverThroughShipPassage(
  page: Page,
  timeout = 8_000,
): Promise<void> {
  const mode = page.getByTestId("run-mode");
  await page.keyboard.down("Space");
  await expect(mode).toHaveText("Ship", { timeout });
  await page.keyboard.up("Space");
  await expect(mode).toHaveText("Cube", { timeout });
}
