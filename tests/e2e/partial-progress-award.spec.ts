import { expect, test } from "@playwright/test";

test("dying after partial progress awards coins for the new best percent", async ({
  page,
}) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const readPercent = async (): Promise<number> =>
    Number((await progress.textContent())?.replace("%", ""));

  await expect
    .poll(readPercent, { intervals: [20], timeout: 3_000 })
    .toBeGreaterThanOrEqual(8);
  await page.keyboard.press("Space");

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 5_000 });

  const partialPercent = await readPercent();
  expect(partialPercent).toBeGreaterThan(0);
  expect(partialPercent).toBeLessThan(100);

  await failedDialog
    .getByRole("button", { name: "Return to Lobby" })
    .click();

  await expect(page.getByTestId("level-1-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("level-1-best-percent")).toHaveText(
    `${partialPercent}%`,
  );
  await expect(page.getByTestId("profile-coins")).toHaveText(
    `${partialPercent} Coins`,
  );
  await expect(page.getByTestId("level-2-status")).toHaveText("Locked");
});
