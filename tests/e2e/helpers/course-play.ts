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
  await tapAtPercents(page, [3, 10]);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [25, 29, 35, 42]);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [61, 62, 63, 70, 77]);
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 8_000 });
}

export async function hoverThroughShipPassage(
  page: Page,
  timeout = 8_000,
): Promise<void> {
  const mode = page.getByTestId("run-mode");
  const enteringFromCube = (await mode.textContent()) !== "Ship";

  if (enteringFromCube) {
    await page.keyboard.down("Space");
  }

  await expect(mode).toHaveText("Ship", { timeout });

  if (enteringFromCube) {
    await page.waitForTimeout(110);
    await page.keyboard.up("Space");
  }

  await expect
    .poll(
      async () => {
        if ((await mode.textContent()) !== "Ship") {
          return "Cube";
        }
        await page.keyboard.down("Space");
        await page.waitForTimeout(90);
        await page.keyboard.up("Space");
        await page.waitForTimeout(90);
        return (await mode.textContent()) ?? "";
      },
      { intervals: [0], timeout },
    )
    .toBe("Cube");
}
