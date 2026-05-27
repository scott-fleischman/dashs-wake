import { expect, test } from "@playwright/test";
import { completeFirstWake } from "./helpers/course-play";

test("completing a level updates lobby status, unlocks, and coins", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByTestId("profile-coins")).toHaveText("0 Coins");
  await page.getByTestId("destination-official-levels").click();
  await expect(page.getByTestId("level-1-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("level-2-status")).toHaveText("Locked");

  await page.getByTestId("level-1-play").click();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();

  await completeFirstWake(page);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible();
  await expect(page.getByTestId("level-complete-reward")).toHaveText(
    "Earned: 100 Coins + 1 Easy Key",
  );

  await completeDialog.getByRole("button", { name: "Return to Lobby" }).click();

  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-1-play")).toHaveText("Replay");
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("level-2-play")).toHaveText("Play");
  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");

  await page.reload();

  await expect(page.getByTestId("level-1-status")).toHaveText("Complete");
  await expect(page.getByTestId("level-1-best-percent")).toHaveText("100%");
  await expect(page.getByTestId("level-1-play")).toHaveText("Replay");
  await expect(page.getByTestId("level-2-status")).toHaveText("Unlocked");
  await expect(page.getByTestId("profile-coins")).toHaveText("100 Coins");
  await expect(page.getByTestId("profile-keys-easy")).toHaveText("1 Easy Key");
});
