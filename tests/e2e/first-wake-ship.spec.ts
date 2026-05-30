import { expect, test } from "@playwright/test";

test("First Wake runs through cube and ship modes to completion", async ({
  page,
}) => {
  await page.goto("/#play/level_1?autopilot");

  await expect(page.getByRole("heading", { name: "First Wake" })).toBeVisible();
  await expect(page.getByTestId("run-mode")).toHaveText("Cube");

  // The reference run carries the cube through the ship passage; observe the
  // mode flip to Ship before the level completes.
  await expect
    .poll(async () => page.getByTestId("run-mode").textContent(), {
      timeout: 30_000,
    })
    .toBe("Ship");

  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("run-progress")).toHaveText("100%");
});
