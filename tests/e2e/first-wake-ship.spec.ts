import { expect, test } from "@playwright/test";
import { tapAtPercents } from "./helpers/course-play";

test("First Wake completes through cube and ship modes", async ({ page }) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const mode = page.getByTestId("run-mode");

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(mode).toHaveText("Cube");

  await tapAtPercents(page, [3, 10]);

  await expect(mode).toHaveText("Ship", { timeout: 5_000 });
  await expect(mode).toHaveText("Cube", { timeout: 5_000 });

  await tapAtPercents(page, [29, 35, 42, 63, 70, 77]);

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 8_000 });
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "First Wake",
  );
});
