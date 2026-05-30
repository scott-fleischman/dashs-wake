import { describe, expect, it } from "vitest";
import {
  applyAtomicPattern,
  type AtomicPatternId,
} from "../../src/content/atomic-patterns";
import { buildPlaceholderBeatMap } from "../../src/content/beat-maps";
import { CourseBuilder } from "../../src/content/course-builder";
import { OFFICIAL_LEVEL_RULES } from "../../src/content/level-rules";
import type { LevelContent } from "../../src/content/first-wake";
import { withSupportingTerrain } from "../../src/content/terrain";
import { recordConservativeDemo, simulateConservativeRun } from "../../src/core/level-solver";

function assemble(b: CourseBuilder): LevelContent {
  applyAtomicPattern(b, "floor-run", { cubesWide: 10 });
  const finishX = b.finishX(400);
  return {
    beatMap: buildPlaceholderBeatMap(
      finishX,
      OFFICIAL_LEVEL_RULES.horizontalSpeed,
    ),
    entities: withSupportingTerrain(b.entities, finishX, b.channels),
    finishX,
    rules: OFFICIAL_LEVEL_RULES,
  };
}

function patternDemo(id: AtomicPatternId, options = {}): ReturnType<typeof recordConservativeDemo> {
  const b = new CourseBuilder({ idPrefix: id });
  applyAtomicPattern(b, id, options);
  applyAtomicPattern(b, "floor-run", { cubesWide: 8 });
  return recordConservativeDemo(assemble(b));
}

describe("atomic patterns", () => {
  it.each([
    ["floor-run", { cubesWide: 6 }],
    ["stair-step", { steps: 1 }],
    ["stair-gap", { steps: 1 }],
    ["stair-spike-edge", { steps: 1 }],
    ["pad-boost", {}],
    ["pad-chain", { count: 3 }],
    ["jump-orb", {}],
    ["orb-stack", { count: 3 }],
    ["fake-pad", {}],
    ["spike-strip", { count: 2 }],
  ] as const satisfies readonly [AtomicPatternId, Record<string, number>][])(
    "%s clears under the conservative solver",
    (id, options) => {
      const demo = patternDemo(id, options);
      expect(demo.success, id).toBe(true);
    },
  );

  it("layers atomic patterns into a composed course", () => {
    const b = new CourseBuilder({ idPrefix: "compose" });
    applyAtomicPattern(b, "floor-run", { cubesWide: 8 });
    applyAtomicPattern(b, "spike-strip", { count: 2 });
    applyAtomicPattern(b, "floor-run", { cubesWide: 8 });
    applyAtomicPattern(b, "pad-chain", { count: 4 });
    applyAtomicPattern(b, "floor-run", { cubesWide: 12 });

    const level = assemble(b);
    const result = simulateConservativeRun(level);
    expect(result.reachedFinish).toBe(true);
  });
});
