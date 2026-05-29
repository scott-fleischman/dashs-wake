import { describe, expect, it } from "vitest";
import { firstWakeLevel } from "../../src/content/first-wake";
import { getOfficialLevelContent } from "../../src/content/official-levels";
import {
  recordConservativeDemo,
  simulateConservativeRun,
} from "../../src/core/level-solver";

describe("conservative level solver", () => {
  it("records a successful demo for First Wake", () => {
    const demo = recordConservativeDemo(firstWakeLevel);

    expect(demo.success).toBe(true);
    expect(demo.frames.length).toBeGreaterThan(100);
    expect(demo.frames.at(-1)?.x).toBeGreaterThanOrEqual(firstWakeLevel.finishX);
  });

  it("matches validateGeneratedPlayability success for official courses", () => {
    const content = getOfficialLevelContent("level_6");
    const result = simulateConservativeRun(content);

    expect(result.reachedFinish).toBe(true);
    expect(result.deathCause).toBeUndefined();
  });
});
