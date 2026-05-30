import { describe, expect, it } from "vitest";
import {
  CUBE,
  cubes,
  impulseReachY,
  JUMP_AIRTIME_S,
  JUMP_REACH_X,
  JUMP_REACH_Y,
  ORB_IMPULSE,
  PAD_IMPULSE,
  PATTERN_RULES,
  SAFE_STEP_RISE,
  snapCube,
  STEP_SPAN_X,
} from "../../src/content/jump-grid";

describe("jump grid", () => {
  it("uses the player width as the cube unit", () => {
    expect(CUBE).toBe(PATTERN_RULES.playerWidth);
    expect(cubes(10)).toBe(CUBE * 10);
  });

  it("derives jump reach from shared run rules", () => {
    const expectedReachX = Math.round(
      PATTERN_RULES.horizontalSpeed *
        ((2 * Math.abs(PATTERN_RULES.jumpVelocity)) / PATTERN_RULES.gravity),
    );
    const expectedReachY = Math.round(
      (PATTERN_RULES.jumpVelocity * PATTERN_RULES.jumpVelocity) /
        (2 * PATTERN_RULES.gravity),
    );

    expect(JUMP_AIRTIME_S).toBeCloseTo(
      (2 * Math.abs(PATTERN_RULES.jumpVelocity)) / PATTERN_RULES.gravity,
    );
    expect(JUMP_REACH_X).toBe(expectedReachX);
    expect(JUMP_REACH_Y).toBe(expectedReachY);
    expect(SAFE_STEP_RISE).toBeLessThanOrEqual(JUMP_REACH_Y);
  });

  it("snaps coordinates to cube boundaries", () => {
    expect(snapCube(CUBE * 2.4)).toBe(cubes(2));
    expect(STEP_SPAN_X % CUBE).toBe(0);
  });

  it("computes impulse reach heights for pads and orbs", () => {
    expect(impulseReachY(PAD_IMPULSE)).toBeGreaterThan(JUMP_REACH_Y);
    expect(impulseReachY(ORB_IMPULSE)).toBeGreaterThan(JUMP_REACH_Y);
  });
});
