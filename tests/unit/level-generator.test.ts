import { describe, expect, it } from "vitest";
import { generateLevel } from "../../src/core/generator";
import type { BeatMap } from "../../src/content/first-wake";

const FIXTURE_BEAT_MAP: BeatMap = {
  beats: [0, 600, 1200, 1800, 2400, 3000, 3600],
  durationMs: 4200,
};

describe("seeded level generator", () => {
  it("produces identical output for the same seed and beat map", () => {
    const input = {
      seed: 1234,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal" as const,
    };

    const a = generateLevel(input);
    const b = generateLevel(input);

    expect(a.entities).toEqual(b.entities);
    expect(a.finishX).toBe(b.finishX);
    expect(a.beatMap.durationMs).toBe(b.beatMap.durationMs);
  });

  it("produces different entities for a different seed", () => {
    const a = generateLevel({
      seed: 1234,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal",
    });
    const b = generateLevel({
      seed: 9876,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal",
    });

    expect(a.entities).not.toEqual(b.entities);
  });

  it("preserves the beat map duration on the generated level", () => {
    const result = generateLevel({
      seed: 7,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal",
    });

    expect(result.beatMap.durationMs).toBe(FIXTURE_BEAT_MAP.durationMs);
    expect(result.beatMap.beats).toEqual(FIXTURE_BEAT_MAP.beats);
  });

  it("places every authored entity inside the finish line", () => {
    const result = generateLevel({
      seed: 42,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal",
    });

    expect(result.finishX).toBeGreaterThan(0);
    for (const entity of result.entities) {
      expect(entity.x).toBeGreaterThanOrEqual(0);
      expect(entity.x + entity.width).toBeLessThanOrEqual(result.finishX);
    }
  });

  it("adds beat-synchronized solid blocks and ambience for normal generated runs", () => {
    const result = generateLevel({
      seed: 1234,
      beatMap: FIXTURE_BEAT_MAP,
      difficulty: "normal",
    });

    expect(result.entities.some((entity) => entity.type === "block")).toBe(true);
    expect(result.entities.some((entity) => entity.type === "decoration")).toBe(true);

    const gameplay = result.entities
      .filter((entity) => entity.type !== "decoration")
      .slice()
      .sort((a, b) => a.x - b.x);
    for (let index = 1; index < gameplay.length; index += 1) {
      expect(gameplay[index]!.x - gameplay[index - 1]!.x).toBeGreaterThanOrEqual(
        220,
      );
    }
  });
});
