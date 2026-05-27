import { expect, test } from "@playwright/test";

test("run speed can be lowered on the death screen before restarting", async ({
  page,
}) => {
  await page.goto("/#play");

  const failedDialog = page.getByRole("dialog", { name: "Run failed" });
  await expect(failedDialog).toBeVisible({ timeout: 3_000 });

  const speed = failedDialog.getByTestId("run-speed");
  await expect(speed).toBeEnabled();
  await speed.selectOption("1");
  await expect(speed).toHaveValue("1");

  await failedDialog.getByRole("button", { name: "Restart" }).click();

  await expect(failedDialog).toBeHidden();
  await expect(page.getByTestId("run-speed")).toHaveValue("1");
});
