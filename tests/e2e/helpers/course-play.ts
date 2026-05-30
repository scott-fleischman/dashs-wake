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
  await completeViaAutopilot(page, "level_1");
}

/**
 * Drives an official level to completion using its conservative reference demo
 * via the `?autopilot` play route. This resolves the attempt through the normal
 * play path, so rewards, unlocks, and the "Level complete" dialog behave exactly
 * as a hand-played clear would — the deterministic way to clear levels that are
 * too hard to hand-script.
 */
export async function completeViaAutopilot(
  page: Page,
  levelId: string,
  timeout = 30_000,
): Promise<void> {
  await page.goto(`/#play/${levelId}?autopilot`);
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout });
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
