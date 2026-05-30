import { expect, test } from "@playwright/test";
import { completeViaAutopilot } from "./helpers/course-play";

test.setTimeout(60_000);

test("replaying a level within one mount shows no reward the second time", async ({
  page,
}) => {
  await completeViaAutopilot(page, "level_1");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible();
  await expect(page.getByTestId("level-complete-reward")).toHaveText(
    "Earned: 100 Coins + 1 Easy Key",
  );

  await completeDialog.getByRole("button", { name: "Replay" }).click();

  // Replay restarts the same mount; the autopilot reference run replays and
  // completes again, but the reward must not be granted a second time.
  await expect(completeDialog).toBeHidden();
  await expect(completeDialog).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("level-complete-reward")).toBeHidden();
});
