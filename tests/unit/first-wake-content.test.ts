import { describe, expect, it } from "vitest";
import {
  firstWakeLevel,
  validateLevelReachability,
} from "../../src/content/first-wake";

const STARTER_MECHANIC_TYPES = new Set(["gap", "platform", "spike"]);

describe("First Wake content contract", () => {
  it("uses only starter cube mechanics, with no launch pads or orbs", () => {
    expect(firstWakeLevel.entities.length).toBeGreaterThan(0);

    for (const entity of firstWakeLevel.entities) {
      expect(STARTER_MECHANIC_TYPES.has(entity.type)).toBe(true);
      expect(entity.type).not.toBe("pad");
      expect(entity.type).not.toBe("orb");
    }
  });

  it("ships a placeholder beat map whose duration covers the finish line", () => {
    const traversalMs =
      (firstWakeLevel.finishX / firstWakeLevel.rules.horizontalSpeed) * 1000;

    expect(firstWakeLevel.beatMap.durationMs).toBeGreaterThan(0);
    expect(firstWakeLevel.beatMap.durationMs).toBeGreaterThanOrEqual(traversalMs);
    expect(firstWakeLevel.beatMap.beats.length).toBeGreaterThan(0);

    for (const beat of firstWakeLevel.beatMap.beats) {
      expect(beat).toBeGreaterThanOrEqual(0);
      expect(beat).toBeLessThanOrEqual(firstWakeLevel.beatMap.durationMs);
    }
  });

  it("authors reachable starter segments validated against jump physics", () => {
    const result = validateLevelReachability(firstWakeLevel);

    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("flags content whose gap exceeds the jump arc", () => {
    const maxJump =
      firstWakeLevel.rules.horizontalSpeed *
      ((2 * Math.abs(firstWakeLevel.rules.jumpVelocity)) /
        firstWakeLevel.rules.gravity);

    const result = validateLevelReachability({
      ...firstWakeLevel,
      entities: [
        ...firstWakeLevel.entities,
        { type: "gap", width: maxJump + 10, x: 30 },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.join(" ")).toMatch(/gap/i);
  });
});
