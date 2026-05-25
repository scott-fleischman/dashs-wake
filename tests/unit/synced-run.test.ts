import { describe, expect, it } from "vitest";
import {
  advanceSyncedRun,
  startSyncedRun,
  type ClockState,
} from "../../src/core/synced-run";
import type { RunRules } from "../../src/core/run-simulation";

const RULES: RunRules = {
  fallBoundaryY: 220,
  gravity: 1000,
  groundY: 200,
  horizontalSpeed: 100,
  jumpVelocity: -400,
  playerHeight: 20,
  playerWidth: 20,
};

const STEADY_INPUT = { jumpPressed: false };

function clockAt(elapsedMs: number, paused = false): ClockState {
  return { elapsedMs, paused };
}

describe("synced run lifecycle", () => {
  it("advances the simulation by the clock's elapsed delta", () => {
    let run = startSyncedRun(RULES);

    run = advanceSyncedRun(run, clockAt(100), STEADY_INPUT, RULES, []);

    expect(run.state.elapsedMs).toBe(100);
  });

  it("freezes the simulation while the clock reports paused", () => {
    let run = startSyncedRun(RULES);

    run = advanceSyncedRun(run, clockAt(150, true), STEADY_INPUT, RULES, []);

    expect(run.state.elapsedMs).toBe(0);
  });

  it("resumes accurately after a pause without double-counting elapsed time", () => {
    let run = startSyncedRun(RULES);
    run = advanceSyncedRun(run, clockAt(100), STEADY_INPUT, RULES, []);
    run = advanceSyncedRun(run, clockAt(100, true), STEADY_INPUT, RULES, []);

    run = advanceSyncedRun(run, clockAt(250), STEADY_INPUT, RULES, []);

    expect(run.state.elapsedMs).toBe(250);
  });

  it("resets the simulation when the clock returns to zero", () => {
    let run = startSyncedRun(RULES);
    run = advanceSyncedRun(run, clockAt(500), STEADY_INPUT, RULES, []);

    run = advanceSyncedRun(run, clockAt(0), STEADY_INPUT, RULES, []);

    expect(run.state.elapsedMs).toBe(0);
  });
});
