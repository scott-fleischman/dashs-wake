import { describe, expect, it } from "vitest";
import {
  createRunState,
  tickRun,
  type RunRules,
} from "../../src/core/run-simulation";

const rules: RunRules = {
  gravity: 20,
  groundY: 100,
  horizontalSpeed: 10,
  jumpVelocity: -10,
};

describe("cube run simulation", () => {
  it("moves forward at a fixed speed while grounded", () => {
    const state = tickRun(createRunState(rules), { jumpPressed: false }, 500, rules);

    expect(state.elapsedMs).toBe(500);
    expect(state.player.x).toBeCloseTo(5);
    expect(state.player.y).toBe(rules.groundY);
    expect(state.player.grounded).toBe(true);
  });

  it("jumps only from the ground and falls back under gravity", () => {
    const takeoff = tickRun(createRunState(rules), { jumpPressed: true }, 100, rules);

    expect(takeoff.player.x).toBeCloseTo(1);
    expect(takeoff.player.y).toBeCloseTo(99.2);
    expect(takeoff.player.velocityY).toBeCloseTo(-8);
    expect(takeoff.player.grounded).toBe(false);

    const airborneAttempt = tickRun(takeoff, { jumpPressed: true }, 100, rules);

    expect(airborneAttempt.player.velocityY).toBeCloseTo(-6);
    expect(airborneAttempt.player.y).toBeCloseTo(98.6);

    let landed = airborneAttempt;
    for (let frame = 0; frame < 10; frame += 1) {
      landed = tickRun(landed, { jumpPressed: false }, 100, rules);
    }

    expect(landed.player.y).toBe(rules.groundY);
    expect(landed.player.velocityY).toBe(0);
    expect(landed.player.grounded).toBe(true);
  });
});
