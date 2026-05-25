import { expect, test } from "@playwright/test";
import { generateSilentWav } from "./helpers/silent-wav";

test("pausing a generated audio run also pauses the audio", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();

  await page.getByTestId("upload-audio").setInputFiles({
    name: "fixture.wav",
    mimeType: "audio/wav",
    buffer: generateSilentWav(2),
  });

  await page.getByTestId("audio-derived-level-1-play").click();

  const audio = page.getByTestId("level-audio");
  await expect(audio).toBeAttached({ timeout: 10_000 });

  await expect
    .poll(
      () => audio.evaluate((el) => (el as HTMLAudioElement).paused),
      { intervals: [50], timeout: 3_000 },
    )
    .toBe(false);

  await page.getByRole("button", { name: "Pause" }).click();
  await expect
    .poll(
      () => audio.evaluate((el) => (el as HTMLAudioElement).paused),
      { intervals: [50], timeout: 2_000 },
    )
    .toBe(true);

  await page.getByRole("button", { name: "Resume" }).click();
  await expect
    .poll(
      () => audio.evaluate((el) => (el as HTMLAudioElement).paused),
      { intervals: [50], timeout: 2_000 },
    )
    .toBe(false);
});
