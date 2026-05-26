import { expect, test } from "@playwright/test";
import { generateSilentWav } from "./helpers/silent-wav";

test("imports a local audio fixture and plays a synchronized generated level", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();
  await expect(
    page.getByRole("heading", { name: "Generated Levels" }),
  ).toBeVisible();

  await page.getByTestId("upload-audio").setInputFiles({
    name: "fixture.wav",
    mimeType: "audio/wav",
    buffer: generateSilentWav({
      durationSec: 2,
      impulseTimesMs: [0, 500, 1000, 1500],
    }),
  });

  const playButton = page.getByTestId("audio-derived-level-1-play");
  await expect(playButton).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("audio-derived-level-1-name")).toContainText(
    "fixture",
  );
  await expect(page.getByTestId("audio-derived-level-1-status")).toHaveText(
    "Synced",
  );

  await playButton.click();
  await expect(
    page.getByRole("button", { name: "Jump Space / Click" }),
  ).toBeEnabled();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("level-audio")).toBeAttached({
    timeout: 10_000,
  });
  for (let tap = 0; tap < 20; tap += 1) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(180);
  }
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 15_000 });
});
