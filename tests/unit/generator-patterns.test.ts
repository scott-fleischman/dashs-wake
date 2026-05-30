import { describe, expect, it } from "vitest";
import {
  permittedPatterns,
  selectBeatPattern,
  type BeatContext,
} from "../../src/core/generator";

function baseContext(overrides: Partial<BeatContext>): BeatContext {
  return {
    beatMs: 1000,
    difficulty: "normal",
    horizontalSpeed: 190,
    intensity: "intense",
    random: 0,
    subRank: "bronze",
    ...overrides,
  };
}

describe("generator atomic pattern rules", () => {
  it("permits floor runs on easy quiet beats and fog ambience", () => {
    expect(permittedPatterns("quiet", "easy")).toEqual(["floor-run", "fog"]);
    expect(permittedPatterns("intense", "easy")).toEqual(["floor-run"]);
  });

  it("permits stair and spike patterns from normal difficulty up", () => {
    expect(permittedPatterns("intense", "normal")).toContain("stair-step");
    expect(permittedPatterns("intense", "normal")).toContain("spike-strip");
    expect(permittedPatterns("intense", "hard")).toContain("stair-gap");
    expect(permittedPatterns("intense", "hard")).toContain("pad-boost");
  });

  it("permits orb patterns at higher difficulties", () => {
    expect(permittedPatterns("intense", "harder")).toContain("jump-orb");
    expect(permittedPatterns("intense", "insane")).toContain("orb-stack");
    expect(permittedPatterns("intense", "demon")).toContain("fake-pad");
  });

  it("selectBeatPattern returns skip when the beat permits no pattern", () => {
    const selection = selectBeatPattern(
      baseContext({ intensity: "quiet", difficulty: "normal", random: 0 }),
    );

    expect(selection.type).toBe("skip");
  });

  it("selectBeatPattern returns skip when random falls outside the placement window", () => {
    const selection = selectBeatPattern(
      baseContext({ intensity: "intense", difficulty: "normal", random: 0.95 }),
    );

    expect(selection.type).toBe("skip");
  });

  it("selectBeatPattern returns a permitted pattern when random is inside the window", () => {
    const selection = selectBeatPattern(
      baseContext({ intensity: "intense", difficulty: "normal", random: 0.05 }),
    );

    expect(selection.type).toBe("spike-strip");
  });
});
