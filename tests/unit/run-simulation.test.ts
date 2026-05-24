import { describe, expect, it } from "vitest";
import {
  createRunState,
  resetRunState,
  tickRun,
  type LevelEntity,
  type RunState,
  type RunRules,
} from "../../src/core/run-simulation";

const rules: RunRules = {
  fallBoundaryY: 120,
  gravity: 20,
  groundY: 100,
  horizontalSpeed: 10,
  jumpVelocity: -10,
  playerHeight: 10,
  playerWidth: 10,
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

  it("lands safely on the top of a platform", () => {
    const platform: LevelEntity = {
      type: "platform",
      height: 4,
      width: 20,
      x: 5,
      y: 92,
    };
    const fallingState: RunState = {
      elapsedMs: 400,
      player: {
        grounded: false,
        velocityY: 8,
        x: 9,
        y: 91,
      },
      status: "running",
    };

    const landed = tickRun(fallingState, { jumpPressed: false }, 100, rules, [platform]);

    expect(landed.status).toBe("running");
    expect(landed.player.y).toBe(platform.y);
    expect(landed.player.velocityY).toBe(0);
    expect(landed.player.grounded).toBe(true);
  });

  it("records a spike death when the cube touches a hazard", () => {
    const spike: LevelEntity = {
      type: "spike",
      height: 10,
      width: 5,
      x: 3,
      y: 90,
    };

    const dead = tickRun(createRunState(rules), { jumpPressed: false }, 500, rules, [spike]);

    expect(dead.status).toBe("dead");
    expect(dead.deathCause).toBe("spike");
  });

  it("falls through gaps and resets a dead run to its start state", () => {
    const gap: LevelEntity = {
      type: "gap",
      width: 30,
      x: 0,
    };
    const atGap: RunState = {
      ...createRunState(rules),
      player: {
        ...createRunState(rules).player,
        x: 6,
      },
    };

    const dead = tickRun(atGap, { jumpPressed: false }, 1000, rules, [gap]);

    expect(dead.status).toBe("dead");
    expect(dead.deathCause).toBe("fall");
    expect(resetRunState(dead, rules)).toEqual(createRunState(rules));
  });
});
