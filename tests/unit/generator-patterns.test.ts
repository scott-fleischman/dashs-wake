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

describe("generator pattern rules", () => {
  it("permits no patterns on a quiet beat", () => {
    expect(permittedPatterns("quiet", "easy")).toEqual([]);
    expect(permittedPatterns("quiet", "insane")).toContain("portal-ship");
  });

  it("permits spikes on intense beats from normal difficulty up", () => {
    expect(permittedPatterns("intense", "easy")).not.toContain("spike");
    expect(permittedPatterns("intense", "normal")).toContain("spike");
    expect(permittedPatterns("intense", "hard")).toContain("spike");
  });

  it("introduces solid blocks at normal difficulty and jump orbs at insane difficulty", () => {
    expect(permittedPatterns("intense", "easy")).not.toContain("block");
    expect(permittedPatterns("intense", "normal")).toContain("block");
    expect(permittedPatterns("intense", "hard")).toContain("block");
    expect(permittedPatterns("intense", "hard")).not.toContain("orb");
    expect(permittedPatterns("intense", "insane")).toContain("orb");
  });

  it("permits launch pads only on intense beats at hard difficulty or above", () => {
    expect(permittedPatterns("intense", "easy")).not.toContain("pad");
    expect(permittedPatterns("intense", "normal")).not.toContain("pad");
    expect(permittedPatterns("intense", "hard")).toContain("pad");
    expect(permittedPatterns("intense", "harder")).toContain("pad");
  });

  it("selectBeatPattern returns skip when the beat permits no pattern", () => {
    const selection = selectBeatPattern(
      baseContext({ intensity: "quiet", difficulty: "hard", random: 0 }),
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

    expect(selection.type).toBe("spike");
  });
});
