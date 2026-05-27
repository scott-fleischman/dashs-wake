import { describe, expect, it } from "vitest";
import { firstWakeLevel } from "../../src/content/first-wake";
import {
  generateValidLevel,
  validateGeneratedPlayability,
} from "../../src/core/generator";

describe("generated level playability", () => {
  it("accepts a known playable level fixture", () => {
    const result = validateGeneratedPlayability(firstWakeLevel);

    expect(result.issues).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("keeps a normal generated block course playable for conservative input", () => {
    const result = generateValidLevel(
      {
        seed: 1001,
        beatIntensities: ["intense", "intense", "intense", "intense", "intense"],
        beatMap: { beats: [0, 600, 1200, 1800, 2400], durationMs: 3000 },
        difficulty: "normal",
      },
      1,
    );

    expect(result.level).not.toBeNull();
  });

  it("rejects a level whose hazards are packed too tight for the conservative AI", () => {
    const tooTight = {
      ...firstWakeLevel,
      entities: [
        { type: "spike" as const, height: 30, width: 30, x: 160, y: 270 },
        { type: "spike" as const, height: 30, width: 30, x: 315, y: 270 },
      ],
      finishX: 600,
    };

    const result = validateGeneratedPlayability(tooTight);

    expect(result.ok).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
    const failure = result.issues[0]!;
    expect(failure.code).toBe("ai-died");
    expect(failure.x).toBeGreaterThan(0);
    expect(failure.message.length).toBeGreaterThan(0);
  });
});

describe("generateValidLevel retry loop", () => {
  it("returns a level within the maxRetries bound", () => {
    const result = generateValidLevel(
      {
        seed: 1,
        beatMap: { beats: [0, 600, 1200], durationMs: 2000 },
        difficulty: "normal",
      },
      10,
    );

    expect(result.attempts).toBeGreaterThan(0);
    expect(result.attempts).toBeLessThanOrEqual(10);
    expect(result.level).not.toBeNull();
  });
});
