import { expect, test } from "@playwright/test";
import { tapAtPercents } from "./helpers/course-play";

test("generates, persists, reopens, and completes a placeholder generated level", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByTestId("destination-generated-levels").click();
  await expect(
    page.getByRole("heading", { name: "Generated Levels" }),
  ).toBeVisible();

  await page.getByTestId("generate-level").click();

  const playButton = page.getByTestId("generated-level-1-play");
  await expect(playButton).toBeVisible();

  await page.reload();
  await expect(playButton).toBeVisible();

  await playButton.click();
  await expect(
    page.getByRole("button", { name: "Jump Space / Click" }),
  ).toBeEnabled();
  await tapAtPercents(page, [5, 32], 5_000);
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("level-complete-reward")).toBeHidden();
});
