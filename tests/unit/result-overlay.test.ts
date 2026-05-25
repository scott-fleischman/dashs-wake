import { describe, expect, it } from "vitest";
import { resultOverlayCopyForDeath } from "../../src/ui/first-wake";

describe("result overlay copy", () => {
  it("uses crash copy for spike collisions", () => {
    expect(resultOverlayCopyForDeath("spike")).toEqual({
      heading: "Crash",
      message: "Hazard collision. Restart from 0%.",
    });
  });

  it("uses crash copy for trap activations", () => {
    expect(resultOverlayCopyForDeath("trap")).toEqual({
      heading: "Crash",
      message: "Hazard collision. Restart from 0%.",
    });
  });

  it("uses fall copy when the player fell out of bounds", () => {
    expect(resultOverlayCopyForDeath("fall")).toEqual({
      heading: "Fell",
      message: "Fell out of bounds. Restart from 0%.",
    });
  });

  it("falls back to crash copy when the death cause is unknown", () => {
    expect(resultOverlayCopyForDeath(undefined)).toEqual({
      heading: "Crash",
      message: "Hazard collision. Restart from 0%.",
    });
  });
});
