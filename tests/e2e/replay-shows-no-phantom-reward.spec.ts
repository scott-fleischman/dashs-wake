import { expect, test } from "@playwright/test";

async function playFirstWakeToCompletion(
  page: import("@playwright/test").Page,
): Promise<void> {
  const progress = page.getByTestId("run-progress");
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
  await expect
    .poll(readPercent, { intervals: [20], timeout: 5_000 })
    .toBeGreaterThanOrEqual(61);
  await page.keyboard.press("Space");
  await expect
    .poll(readPercent, { intervals: [20], timeout: 4_000 })
    .toBeGreaterThanOrEqual(84);
  await page.keyboard.press("Space");
}

test("replaying a level within one mount shows no reward the second time", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("level-1-play").click();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();

  await playFirstWakeToCompletion(page);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 6_000 });
  await expect(page.getByTestId("level-complete-reward")).toHaveText(
    "Earned: 100 Coins + 1 Easy Key",
  );

  await completeDialog.getByRole("button", { name: "Replay" }).click();

  await playFirstWakeToCompletion(page);

  await expect(completeDialog).toBeVisible({ timeout: 6_000 });
  await expect(page.getByTestId("level-complete-reward")).toBeHidden();
});
