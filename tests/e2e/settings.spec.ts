import { expect, test } from "@playwright/test";

test("persists movement speed and level color settings", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("destination-settings").click();

  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await page.getByTestId("settings-speed").selectOption("2");
  await page.getByTestId("settings-theme-sunset").click();

  await page.reload();
  await expect(page.getByTestId("settings-speed")).toHaveValue("2");
  await expect(page.getByTestId("settings-theme-sunset")).toHaveClass(/selected/);
});
