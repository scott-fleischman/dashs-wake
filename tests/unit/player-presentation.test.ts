import { describe, expect, it } from "vitest";
import {
  cubeGroundExtent,
  groundedCubeCenterY,
} from "../../src/game/player-presentation";

describe("cubeGroundExtent", () => {
  it("keeps a rotating diamond grounded at its changing lower vertex", () => {
    expect(cubeGroundExtent("diamond", 34, 34, 0)).toBeCloseTo(17);
    expect(cubeGroundExtent("diamond", 34, 34, Math.PI / 4)).toBeCloseTo(
      17 / Math.sqrt(2),
    );
  });

  it("accounts for the larger corner extent of a rotating square", () => {
    expect(cubeGroundExtent("rectangle", 34, 34, 0)).toBeCloseTo(17);
    expect(cubeGroundExtent("rectangle", 34, 34, Math.PI / 4)).toBeCloseTo(
      17 * Math.sqrt(2),
    );
  });

  it("does not bob circular icons as they rotate", () => {
    expect(cubeGroundExtent("circle", 34, 34, Math.PI / 3)).toBe(17);
  });
});

describe("groundedCubeCenterY", () => {
  it("places a landed cube on block surfaces at different heights", () => {
    expect(groundedCubeCenterY(244, "rectangle", 34, 34, 0)).toBe(227);
    expect(groundedCubeCenterY(300, "rectangle", 34, 34, 0)).toBe(283);
  });
});
