import { expect, test } from "@playwright/test";

test("official level select allows the user to scroll down to every level card", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 600 });
  await page.goto("/");
  await page.getByTestId("destination-official-levels").click();

  await expect(page.getByTestId("level-12-play")).toBeAttached();

  const scrollState = await page.evaluate(() => {
    const app = document.getElementById("app");
    if (!app) return { scrollable: false, scrolledBy: 0 };
    const beforeScroll = app.scrollTop;
    app.scrollTop = app.scrollHeight;
    const afterScroll = app.scrollTop;
    return {
      scrollable: app.scrollHeight > app.clientHeight,
      scrolledBy: afterScroll - beforeScroll,
    };
  });

  expect(scrollState.scrollable).toBe(true);
  expect(scrollState.scrolledBy).toBeGreaterThan(0);

  await expect(page.getByTestId("level-12-play")).toBeInViewport();
});
