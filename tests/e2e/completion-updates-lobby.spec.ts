import { expect, test } from "@playwright/test";

test("completing a level updates lobby status, unlocks, and coins", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("profile-coins")).toHaveText("0 Coins");
  await expect(page.getByTestId("level-1-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("level-2-status")).toHaveText("Locked");

  await page.getByTestId("level-1-play").click();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();

  const progress = page.getByTestId("run-progress");
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

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 6_000 });

  await completeDialog.getByRole("button", { name: "Return to Lobby" }).click();

  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");

  await page.reload();

  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");
});
