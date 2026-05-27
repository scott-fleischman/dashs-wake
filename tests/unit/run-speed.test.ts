import { describe, expect, it } from "vitest";
import { isRunSpeedMultiplier, RUN_SPEED_OPTIONS } from "../../src/core/run-speed";

describe("run speed options", () => {
  it("lists the four supported multipliers", () => {
    expect(RUN_SPEED_OPTIONS.map((choice) => choice.value)).toEqual([1, 1.5, 2, 3]);
  });

  it("recognizes configured multipliers", () => {
    expect(isRunSpeedMultiplier(2)).toBe(true);
    expect(isRunSpeedMultiplier(1.25)).toBe(false);
  });
});
