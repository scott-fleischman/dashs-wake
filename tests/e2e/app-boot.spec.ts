import { expect, test } from "@playwright/test";

test("app boot renders the default level select screen", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Official Levels" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();

  expect(consoleErrors).toEqual([]);
});
