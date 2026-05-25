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
    ...overrides,
  };
}

describe("generator pattern rules", () => {
  it("permits no patterns on a quiet beat", () => {
    expect(permittedPatterns("quiet", "easy")).toEqual([]);
    expect(permittedPatterns("quiet", "insane")).toEqual([]);
  });

  it("permits a spike on intense beats from easy difficulty up", () => {
    expect(permittedPatterns("intense", "easy")).toContain("spike");
    expect(permittedPatterns("intense", "normal")).toContain("spike");
    expect(permittedPatterns("intense", "hard")).toContain("spike");
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
