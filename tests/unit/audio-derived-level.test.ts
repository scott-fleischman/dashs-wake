import { describe, expect, it } from "vitest";
import { buildAudioDerivedLevel } from "../../src/ui/generated-levels-room";

describe("buildAudioDerivedLevel", () => {
  it("marks the record synced when the analyzer returned at least one beat", () => {
    const record = buildAudioDerivedLevel(1, "song.mp3", "blob-key", {
      beats: [0, 600, 1200],
      beatIntensities: ["intense", "intense", "intense"],
      durationMs: 1800,
    });
    expect(record.synced).toBe(true);
  });

  it("treats analyzed-but-empty-beats as not synced (silent or sub-threshold audio)", () => {
    const record = buildAudioDerivedLevel(1, "silence.mp3", "blob-key", {
      beats: [],
      beatIntensities: [],
      durationMs: 2000,
    });
    expect(record.synced).toBe(false);
  });

  it("falls back to placeholder beats when synced is false", () => {
    const record = buildAudioDerivedLevel(1, "silence.mp3", "blob-key", {
      beats: [],
      beatIntensities: [],
      durationMs: 2000,
    });
    expect(record.beatMap.beats.length).toBeGreaterThan(0);
  });

  it("marks the record not synced when the analyzer returned null", () => {
    const record = buildAudioDerivedLevel(1, "corrupt.wav", "blob-key", null);
    expect(record.synced).toBe(false);
  });
});
