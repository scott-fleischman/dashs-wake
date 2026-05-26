import { expect, type Page } from "@playwright/test";

export async function tapAtPercents(
  page: Page,
  percents: readonly number[],
  timeout = 8_000,
): Promise<void> {
  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  for (const percent of percents) {
    await expect
      .poll(readPercent, { intervals: [20], timeout })
      .toBeGreaterThanOrEqual(percent);
    await page.keyboard.press("Space");
  }
}

export async function completeFirstWake(page: Page): Promise<void> {
  await tapAtPercents(page, [3, 10, 29, 35, 42, 63, 70, 77]);
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 8_000 });
}
