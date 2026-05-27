import { expect, test } from "@playwright/test";

test("locked level cards and gauntlets show what to clear next", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("destination-official-levels").click();
  await expect(page.getByTestId("level-2-unlock-hint")).toHaveText(
    "Clear First Wake",
  );
  await expect(page.getByTestId("level-3-unlock-hint")).toHaveText(
    "Clear Launch Sequence",
  );

  await page.getByTestId("room-back").click();
  await page.getByTestId("destination-gauntlets").click();
  await expect(page.getByTestId("gauntlet-electric-wake-start")).toBeDisabled();
  await expect(
    page.getByRole("listitem").filter({ hasText: "Electric Wake Gauntlet" }),
  ).toContainText("Clear First Wake, Launch Sequence");
});
