import { expect, test } from "@playwright/test";

test("official level select can reach every level card via the carousel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/#levels");

  await expect(page.getByTestId("level-1-play")).toBeAttached();
  await expect(page.getByTestId("level-8-play")).toBeAttached();

  for (let step = 0; step < 7; step += 1) {
    await page.keyboard.press("ArrowRight");
  }

  await expect(page.locator(".level-dot.active")).toHaveAttribute(
    "aria-label",
    "View Foundry Overdrive",
  );
  await expect(page.getByTestId("level-8-status")).toBeVisible();
});
