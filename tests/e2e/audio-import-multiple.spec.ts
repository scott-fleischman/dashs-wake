import { expect, test } from "@playwright/test";

test("importing two audio files in sequence creates distinct records", async ({
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
    name: "alpha.wav",
    mimeType: "audio/wav",
    buffer: audioBytes,
  });

  await expect(page.getByTestId("audio-derived-level-1-play")).toBeVisible({
    timeout: 10_000,
  });

  await page.getByTestId("upload-audio").setInputFiles({
    name: "beta.wav",
    mimeType: "audio/wav",
    buffer: audioBytes,
  });

  await expect(page.getByTestId("audio-derived-level-2-play")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("audio-derived-level-1-name")).toContainText(
    "alpha",
  );
  await expect(page.getByTestId("audio-derived-level-2-name")).toContainText(
    "beta",
  );
});
