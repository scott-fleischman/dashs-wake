import { expect, test } from "@playwright/test";
import { generateSilentWav } from "./helpers/silent-wav";

test("audio playback stops when the player returns to the lobby", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();

  await page.getByTestId("upload-audio").setInputFiles({
    name: "fixture.wav",
    mimeType: "audio/wav",
    buffer: generateSilentWav({
      durationSec: 2,
      impulseTimesMs: [0, 500, 1000, 1500],
    }),
  });

  await page.getByTestId("audio-derived-level-1-play").click();

  const audio = page.getByTestId("level-audio");
  await expect(audio).toBeAttached({ timeout: 10_000 });

  await page.getByRole("button", { name: "Pause" }).click();
  await page
    .getByRole("dialog", { name: "Paused" })
    .getByRole("button", { name: "Return to Lobby" })
    .click();

  await expect(page.getByTestId("level-audio")).toHaveCount(0, {
    timeout: 3_000,
  });
});
