import { expect, test } from "@playwright/test";

test("imports a local audio fixture and plays a synchronized generated level", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();
  await expect(
    page.getByRole("heading", { name: "Generated Levels" }),
  ).toBeVisible();

  const audioBytes = Buffer.from([
    0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45,
  ]);

  await page.getByTestId("upload-audio").setInputFiles({
    name: "fixture.wav",
    mimeType: "audio/wav",
    buffer: audioBytes,
  });

  const playButton = page.getByTestId("audio-derived-level-1-play");
  await expect(playButton).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("audio-derived-level-1-name")).toContainText(
    "fixture",
  );

  await playButton.click();
  await expect(
    page.getByRole("dialog", { name: "Level complete" }),
  ).toBeVisible({ timeout: 15_000 });
});
