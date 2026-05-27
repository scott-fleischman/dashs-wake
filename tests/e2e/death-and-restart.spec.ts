import { expect, test } from "@playwright/test";

test("dying clears the run and restart begins a fresh attempt", async ({
  page,
}) => {
  await page.goto("/#play");

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 3_000 });
  await expect(page.getByTestId("attempt-count")).toHaveText("Attempt 1");

  await page.keyboard.press("Space");

  await expect(failedDialog).toBeHidden();
  await expect(page.getByTestId("attempt-count")).toHaveText("Attempt 2");
});
