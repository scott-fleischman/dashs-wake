import { expect, test } from "@playwright/test";
import { generateSilentWav } from "./helpers/silent-wav";

test("creates a song-backed authored level with placed pieces and reopens it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByTestId("destination-generated-levels").click();
  await page.getByTestId("create-level").click();

  await expect(page.getByRole("heading", { name: "Level Creator" })).toBeVisible();
  await expect(page.getByTestId("creator-tool-spike")).toContainText("Spike");
  await expect(page.getByTestId("creator-tool-block")).toContainText("Block");
  await expect(page.getByTestId("creator-tool-orb")).toContainText("Jump Orb");
  await expect(page.getByTestId("creator-tool-finish")).toContainText("Finish Point");

  await page.getByTestId("creator-audio").setInputFiles({
    name: "creator-fixture.wav",
    mimeType: "audio/wav",
    buffer: generateSilentWav({
      durationSec: 2,
      impulseTimesMs: [0, 500, 1000, 1500],
    }),
  });
  await expect(page.getByTestId("creator-song-status")).toContainText("loaded", {
    timeout: 10_000,
  });

  await page.getByTestId("creator-name").fill("Built Course");
  await page.getByTestId("creator-tool-finish").click();
  await page.getByTestId("creator-course").click({ position: { x: 800, y: 100 } });
  await page.getByTestId("creator-tool-pad").click();
  await page.getByTestId("creator-course").click({ position: { x: 210, y: 180 } });
  await page.getByTestId("creator-tool-orb").click();
  await page.getByTestId("creator-course").click({ position: { x: 360, y: 130 } });
  await page.getByTestId("creator-tool-block").click();
  await page.getByTestId("creator-course").click({ position: { x: 500, y: 165 } });
  await page.getByRole("button", { name: "Playtest" }).click();

  await expect(page.getByText("Creator Playtest")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Return to Lobby" }).click();
  await expect(page.getByRole("heading", { name: "Level Creator" })).toBeVisible();
  await page.getByRole("button", { name: "Save Level" }).click();

  await expect(page.getByRole("heading", { name: "Generated Levels" })).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByTestId("created-level-1-status")).toHaveText("Created");
  await expect(page.getByTestId("created-level-1-name")).toHaveText("Built Course");

  await page.getByTestId("created-level-1-play").click();
  await expect(page.getByRole("heading", { name: "Built Course" })).toBeVisible();
  await expect(page.getByTestId("level-audio")).toBeAttached({ timeout: 10_000 });

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Return to Lobby" }).click();
  await page.getByTestId("created-level-1-edit").click();
  await expect(page.locator(".creator-entity.block")).toBeVisible();
  await page.getByTestId("creator-name").fill("Revised Course");
  await page.getByRole("button", { name: "Save Level" }).click();
  await expect(page.getByTestId("created-level-1-name")).toHaveText("Revised Course");

  await page.getByTestId("created-level-1-delete").click();
  await expect(page.getByTestId("created-level-1-name")).not.toBeVisible();
});
