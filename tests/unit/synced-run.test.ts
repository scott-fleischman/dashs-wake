import { describe, expect, it } from "vitest";
import {
  advanceSyncedRun,
  createAudioClock,
  createManualClock,
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

  it("resets the simulation even when the clock rewinds while paused", () => {
    let run = startSyncedRun(RULES);
    run = advanceSyncedRun(run, clockAt(500), STEADY_INPUT, RULES, []);
    expect(run.state.elapsedMs).toBe(500);

    run = advanceSyncedRun(run, clockAt(0, true), STEADY_INPUT, RULES, []);
    run = advanceSyncedRun(run, clockAt(10), STEADY_INPUT, RULES, []);

    expect(run.state.elapsedMs).toBe(10);
  });

  it("wraps an audio element into a playable clock", () => {
    const calls: string[] = [];
    const audio = {
      currentTime: 0,
      paused: true,
      pause: () => {
        calls.push("pause");
        audio.paused = true;
      },
      play: async () => {
        calls.push("play");
        audio.paused = false;
      },
    };

    const clock = createAudioClock(audio);

    audio.currentTime = 0.5;
    audio.paused = false;
    expect(clock.read()).toEqual({ elapsedMs: 500, paused: false });

    clock.pause();
    expect(audio.paused).toBe(true);
    expect(calls).toContain("pause");

    clock.resume();
    expect(calls).toContain("play");

    audio.currentTime = 2.5;
    clock.reset();
    expect(audio.currentTime).toBe(0);
  });

  it("drives the synced run through a manual playable clock", () => {
    const clock = createManualClock();
    let run = startSyncedRun(RULES);

    clock.advance(200);
    run = advanceSyncedRun(run, clock.read(), STEADY_INPUT, RULES, []);
    expect(run.state.elapsedMs).toBe(200);

    clock.pause();
    clock.advance(500);
    run = advanceSyncedRun(run, clock.read(), STEADY_INPUT, RULES, []);
    expect(run.state.elapsedMs).toBe(200);

    clock.resume();
    clock.advance(150);
    run = advanceSyncedRun(run, clock.read(), STEADY_INPUT, RULES, []);
    expect(run.state.elapsedMs).toBe(350);

    clock.reset();
    run = advanceSyncedRun(run, clock.read(), STEADY_INPUT, RULES, []);
    expect(run.state.elapsedMs).toBe(0);
  });
});
