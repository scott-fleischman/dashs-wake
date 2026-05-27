import { expect, test } from "@playwright/test";

function trackPageErrors(page: import("@playwright/test").Page): string[] {
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });
  return consoleErrors;
}

test("app boot renders the default level select screen", async ({ page }) => {
  const consoleErrors = trackPageErrors(page);

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Official Levels" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeEnabled();
  await expect(page.locator("#app")).not.toBeEmpty();

  expect(consoleErrors).toEqual([]);
});

test("app boot starts First Wake and advances progress", async ({ page }) => {
  const consoleErrors = trackPageErrors(page);

  await page.goto("/#play/level_1");

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(page.getByRole("status")).toHaveText("Running");
  await expect(page.getByTestId("run-progress")).toBeVisible();

  await expect
    .poll(
      async () =>
        Number((await page.getByTestId("run-progress").textContent())?.replace("%", "")),
      { intervals: [50], timeout: 8_000 },
    )
    .toBeGreaterThan(0);

  expect(consoleErrors).toEqual([]);
});
