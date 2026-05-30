import { describe, expect, it } from "vitest";
import { getOfficialLevelContent } from "../../src/content/official-levels";
import { simulateConservativeRun } from "../../src/core/level-solver";

describe("Hollow Steps", () => {
  it("clears under the conservative solver", () => {
    const level = getOfficialLevelContent("level_2");
    const result = simulateConservativeRun(level);

    expect(result.reachedFinish, `${result.deathCause}@${result.stoppedX}`).toBe(true);
  });
});
