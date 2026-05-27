import { expect, test } from "@playwright/test";
import { completeFirstWake } from "./helpers/course-play";

test.setTimeout(60_000);

test("replaying a level within one mount shows no reward the second time", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("destination-official-levels").click();
  await page.getByTestId("level-1-play").click();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();

  await completeFirstWake(page);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 6_000 });
  await expect(page.getByTestId("level-complete-reward")).toHaveText(
    "Earned: 100 Coins + 1 Easy Key",
  );

  await completeDialog.getByRole("button", { name: "Replay" }).click();

  await completeFirstWake(page);

  await expect(completeDialog).toBeVisible({ timeout: 6_000 });
  await expect(page.getByTestId("level-complete-reward")).toBeHidden();
});
