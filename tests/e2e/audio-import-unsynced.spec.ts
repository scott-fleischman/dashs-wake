import { expect, test } from "@playwright/test";

test("audio import labels the row as Not synced when analysis fails", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();

  const invalidAudioBytes = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);

  await page.getByTestId("upload-audio").setInputFiles({
    name: "broken.wav",
    mimeType: "audio/wav",
    buffer: invalidAudioBytes,
  });

  const statusEl = page.getByTestId("audio-derived-level-1-status");
  await expect(statusEl).toBeVisible({ timeout: 10_000 });
  await expect(statusEl).toHaveText("Not synced");
});
