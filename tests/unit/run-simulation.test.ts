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
  horizontalSpeed: 10,
  jumpVelocity: -10,
  playerHeight: 10,
  playerWidth: 10,
  spawnY: 100,
};

const startingTerrain: LevelEntity = {
  type: "block",
  height: 30,
  width: 200,
  x: 0,
  y: rules.spawnY,
};

describe("cube run simulation", () => {
  it("moves forward at a fixed speed while supported by a block", () => {
    const state = tickRun(
      createRunState(rules),
      { jumpPressed: false },
      500,
      rules,
      [startingTerrain],
    );

    expect(state.elapsedMs).toBe(500);
    expect(state.player.x).toBeCloseTo(5);
    expect(state.player.y).toBe(rules.spawnY);
    expect(state.player.grounded).toBe(true);
  });

  it("jumps only from a supporting block and falls back onto it", () => {
    const takeoff = tickRun(
      createRunState(rules),
      { jumpPressed: true },
      100,
      rules,
      [startingTerrain],
    );

    expect(takeoff.player.x).toBeCloseTo(1);
    expect(takeoff.player.y).toBeCloseTo(99.2);
    expect(takeoff.player.velocityY).toBeCloseTo(-8);
    expect(takeoff.player.grounded).toBe(false);

    const airborneAttempt = tickRun(
      takeoff,
      { jumpPressed: true },
      100,
      rules,
      [startingTerrain],
    );

    expect(airborneAttempt.player.velocityY).toBeCloseTo(-6);
    expect(airborneAttempt.player.y).toBeCloseTo(98.6);

    let landed = airborneAttempt;
    for (let frame = 0; frame < 10; frame += 1) {
      landed = tickRun(
        landed,
        { jumpPressed: false },
        100,
        rules,
        [startingTerrain],
      );
    }

    expect(landed.player.y).toBe(rules.spawnY);
    expect(landed.player.velocityY).toBe(0);
    expect(landed.player.grounded).toBe(true);
  });

  it("lands safely on top of a raised block", () => {
    const ledge: LevelEntity = {
      type: "block",
      height: 4,
      width: 20,
      x: 5,
      y: 92,
    };
    const fallingState: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 400,
      player: {
        grounded: false,
        mode: "cube",
        velocityY: 8,
        x: 9,
        y: 91,
      },
      status: "running",
    };

    const landed = tickRun(fallingState, { jumpPressed: false }, 100, rules, [ledge]);

    expect(landed.status).toBe("running");
    expect(landed.player.y).toBe(ledge.y);
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

    const dead = tickRun(createRunState(rules), { jumpPressed: false }, 500, rules, [
      startingTerrain,
      spike,
    ]);

    expect(dead.status).toBe("dead");
    expect(dead.deathCause).toBe("spike");
  });

  it("falls where blocks are absent and resets a dead run to its start state", () => {
    const shortLedge: LevelEntity = {
      type: "block",
      height: 30,
      width: 8,
      x: 0,
      y: rules.spawnY,
    };
    const atGap: RunState = {
      ...createRunState(rules),
      player: {
        ...createRunState(rules).player,
        x: 6,
      },
    };

    const dead = tickRun(atGap, { jumpPressed: false }, 1000, rules, [
      shortLedge,
    ]);

    expect(dead.status).toBe("dead");
    expect(dead.deathCause).toBe("fall");
    expect(resetRunState(dead, rules)).toEqual(createRunState(rules));
  });
});

describe("solid blocks", () => {
  const block: LevelEntity = {
    type: "block",
    height: 20,
    width: 20,
    x: 5,
    y: 80,
  };

  it("kills a player who runs into a block side", () => {
    const dead = tickRun(createRunState(rules), { jumpPressed: false }, 1000, rules, [
      startingTerrain,
      block,
    ]);

    expect(dead.status).toBe("dead");
    expect(dead.deathCause).toBe("block");
  });

  it("allows a player to land on a block top", () => {
    const falling: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: {
        grounded: false,
        mode: "cube",
        velocityY: 10,
        x: 9,
        y: 79,
      },
      status: "running",
    };

    const landed = tickRun(falling, { jumpPressed: false }, 100, rules, [block]);

    expect(landed.status).toBe("running");
    expect(landed.player.y).toBe(block.y);
  });
});

describe("ship mode portals and motion", () => {
  it("starts a new run in cube mode", () => {
    const state = createRunState(rules);

    expect(state.player.mode).toBe("cube");
  });

  it("switches to ship mode when the player traverses a ship portal", () => {
    const shipPortal: LevelEntity = {
      type: "portal",
      mode: "ship",
      height: 20,
      width: 4,
      x: 4,
      y: 90,
    };

    let state = createRunState(rules);
    for (let frame = 0; frame < 5; frame += 1) {
      state = tickRun(state, { jumpPressed: false }, 100, rules, [
        startingTerrain,
        shipPortal,
      ]);
    }

    expect(state.player.mode).toBe("ship");
  });

  it("stabilizes vertical velocity when a falling cube enters ship mode", () => {
    const shipPortal: LevelEntity = {
      type: "portal",
      mode: "ship",
      height: 30,
      width: 10,
      x: 4,
      y: 70,
    };
    const falling: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: {
        grounded: false,
        mode: "cube",
        velocityY: 12,
        x: 5,
        y: 85,
      },
      status: "running",
    };

    const entered = tickRun(falling, { jumpPressed: false }, 100, rules, [
      shipPortal,
    ]);

    expect(entered.player.mode).toBe("ship");
    expect(entered.player.velocityY).toBe(0);
    expect(entered.player.grounded).toBe(false);
  });

  it("rises while jump is held in ship mode and falls when released", () => {
    const flying: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: {
        grounded: false,
        mode: "ship",
        velocityY: 0,
        x: 50,
        y: 50,
      },
      status: "running",
    };

    const held = tickRun(flying, { jumpPressed: true }, 100, rules);

    expect(held.player.velocityY).toBeLessThan(0);
    expect(held.player.y).toBeLessThan(flying.player.y);
    expect(held.player.mode).toBe("ship");

    const released = tickRun(held, { jumpPressed: false }, 100, rules);

    expect(released.player.velocityY).toBeGreaterThan(held.player.velocityY);
  });

  it("crashes a ship against a lower block rather than landing on it", () => {
    const lowerBlock: LevelEntity = {
      type: "block",
      height: 20,
      width: 30,
      x: 4,
      y: 80,
    };
    const fallingShip: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: {
        grounded: false,
        mode: "ship",
        velocityY: 10,
        x: 5,
        y: 79.5,
      },
      status: "running",
    };

    const collided = tickRun(
      fallingShip,
      { jumpPressed: false },
      100,
      rules,
      [lowerBlock],
    );

    expect(collided.status).toBe("dead");
    expect(collided.deathCause).toBe("block");
  });

  it("returns to cube mode when the ship traverses a cube portal", () => {
    const cubePortal: LevelEntity = {
      type: "portal",
      mode: "cube",
      height: 20,
      width: 4,
      x: 4,
      y: 40,
    };

    let state: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: {
        grounded: false,
        mode: "ship",
        velocityY: 0,
        x: 0,
        y: 50,
      },
      status: "running",
    };

    for (let frame = 0; frame < 5; frame += 1) {
      state = tickRun(state, { jumpPressed: false }, 100, rules, [cubePortal]);
    }

    expect(state.player.mode).toBe("cube");
  });
});

describe("launch pad impulses", () => {
  it("applies a pad's configured upward impulse the first time the player overlaps it", () => {
    const pad: LevelEntity = {
      type: "pad",
      id: "pad-a",
      impulse: 30,
      height: 10,
      width: 6,
      x: 5,
      y: 95,
    };
    const onPad: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: true, mode: "cube", velocityY: 0, x: 8, y: 100 },
      status: "running",
    };

    const after = tickRun(onPad, { jumpPressed: false }, 100, rules, [pad]);

    expect(after.player.velocityY).toBeCloseTo(-30 + rules.gravity * 0.1);
    expect(after.player.grounded).toBe(false);
    expect(after.consumedTriggerIds.has("pad-a")).toBe(true);
  });

  it("applies the strongest impulse when cube jump and pad would fire together", () => {
    const pad: LevelEntity = {
      type: "pad",
      id: "pad-strong",
      impulse: 30,
      height: 10,
      width: 6,
      x: 5,
      y: 95,
    };
    const onPadGrounded: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: true, mode: "cube", velocityY: 0, x: 8, y: 100 },
      status: "running",
    };

    const after = tickRun(
      onPadGrounded,
      { jumpPressed: true },
      100,
      rules,
      [pad],
    );

    expect(after.player.velocityY).toBeCloseTo(-pad.impulse + rules.gravity * 0.1);
    expect(after.consumedTriggerIds.has("pad-strong")).toBe(true);
  });

  it("does not re-apply a pad's impulse while the player remains in contact", () => {
    const pad: LevelEntity = {
      type: "pad",
      id: "pad-a",
      impulse: 30,
      height: 10,
      width: 6,
      x: 5,
      y: 95,
    };
    const afterFirstHit: RunState = {
      consumedTriggerIds: new Set(["pad-a"]),
      elapsedMs: 100,
      player: { grounded: false, mode: "cube", velocityY: -28, x: 9, y: 97.2 },
      status: "running",
    };

    const after = tickRun(afterFirstHit, { jumpPressed: false }, 100, rules, [pad]);

    expect(after.player.velocityY).toBeCloseTo(-28 + rules.gravity * 0.1);
    expect(after.consumedTriggerIds.has("pad-a")).toBe(true);
  });
});

describe("safe orb activations", () => {
  it("applies a safe orb's impulse when jump is pressed during contact", () => {
    const orb: LevelEntity = {
      type: "orb",
      id: "orb-a",
      effect: { kind: "impulse", magnitude: 30 },
      height: 20,
      width: 10,
      x: 5,
      y: 40,
    };
    const inContact: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(inContact, { jumpPressed: true }, 100, rules, [orb]);

    expect(after.player.velocityY).toBeCloseTo(-30 + rules.gravity * 0.1);
    expect(after.consumedTriggerIds.has("orb-a")).toBe(true);
  });

  it("ignores an overlapping orb when no jump input is pressed", () => {
    const orb: LevelEntity = {
      type: "orb",
      id: "orb-a",
      effect: { kind: "impulse", magnitude: 30 },
      height: 20,
      width: 10,
      x: 5,
      y: 40,
    };
    const inContact: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(inContact, { jumpPressed: false }, 100, rules, [orb]);

    expect(after.player.velocityY).toBeCloseTo(rules.gravity * 0.1);
    expect(after.consumedTriggerIds.has("orb-a")).toBe(false);
  });

  it("ignores jump input when the player is not overlapping any orb", () => {
    const orb: LevelEntity = {
      type: "orb",
      id: "orb-a",
      effect: { kind: "impulse", magnitude: 30 },
      height: 20,
      width: 10,
      x: 90,
      y: 40,
    };
    const farAway: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(farAway, { jumpPressed: true }, 100, rules, [orb]);

    expect(after.player.velocityY).toBeCloseTo(rules.gravity * 0.1);
    expect(after.consumedTriggerIds.has("orb-a")).toBe(false);
  });

  it("activates an orb only once per run even when input repeats during contact", () => {
    const orb: LevelEntity = {
      type: "orb",
      id: "orb-a",
      effect: { kind: "impulse", magnitude: 30 },
      height: 20,
      width: 10,
      x: 5,
      y: 40,
    };
    const alreadyConsumed: RunState = {
      consumedTriggerIds: new Set(["orb-a"]),
      elapsedMs: 100,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(alreadyConsumed, { jumpPressed: true }, 100, rules, [orb]);

    expect(after.player.velocityY).toBeCloseTo(rules.gravity * 0.1);
  });
});

describe("trap orb activations", () => {
  it("kills the player when jump fires during contact with a trap orb", () => {
    const trapOrb: LevelEntity = {
      type: "orb",
      id: "trap-1",
      effect: { kind: "kill" },
      height: 20,
      width: 10,
      x: 5,
      y: 40,
    };
    const inContact: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(inContact, { jumpPressed: true }, 100, rules, [trapOrb]);

    expect(after.status).toBe("dead");
    expect(after.deathCause).toBe("trap");
  });

  it("leaves the player alive when bypassing a trap orb without input", () => {
    const trapOrb: LevelEntity = {
      type: "orb",
      id: "trap-1",
      effect: { kind: "kill" },
      height: 20,
      width: 10,
      x: 5,
      y: 40,
    };
    const inContact: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: false, mode: "cube", velocityY: 0, x: 10, y: 50 },
      status: "running",
    };

    const after = tickRun(inContact, { jumpPressed: false }, 100, rules, [trapOrb]);

    expect(after.status).toBe("running");
    expect(after.deathCause).toBeUndefined();
  });

  it("does not kill the player when jump fires outside a trap orb's contact window", () => {
    const trapOrb: LevelEntity = {
      type: "orb",
      id: "trap-1",
      effect: { kind: "kill" },
      height: 20,
      width: 10,
      x: 90,
      y: 40,
    };
    const farAway: RunState = {
      consumedTriggerIds: new Set(),
      elapsedMs: 0,
      player: { grounded: true, mode: "cube", velocityY: 0, x: 10, y: 100 },
      status: "running",
    };

    const after = tickRun(farAway, { jumpPressed: true }, 100, rules, [trapOrb]);

    expect(after.status).toBe("running");
    expect(after.deathCause).toBeUndefined();
  });
});
