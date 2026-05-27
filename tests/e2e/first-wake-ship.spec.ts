import { expect, test } from "@playwright/test";
import {
  hoverThroughShipPassage,
  tapAtPercents,
  waitUntilPercent,
} from "./helpers/course-play";

test("First Wake completes through cube and ship modes", async ({ page }) => {
  await page.goto("/#play");

  const progress = page.getByTestId("run-progress");
  const mode = page.getByTestId("run-mode");

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(mode).toHaveText("Cube");

  await hoverThroughShipPassage(page);

  await waitUntilPercent(page, 32);
  await hoverThroughShipPassage(page);
  await tapAtPercents(page, [69]);
  await waitUntilPercent(page, 74);
  await page.keyboard.down("Space");

  const completeDialog = page.getByRole("dialog", { name: "Level complete" });
  await expect(completeDialog).toBeVisible({ timeout: 8_000 });
  await page.keyboard.up("Space");
  await expect(progress).toHaveText("100%");
  await expect(completeDialog.locator(".result-message")).toContainText(
    "First Wake",
  );
});
