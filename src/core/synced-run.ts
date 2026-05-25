import {
  createRunState,
  tickRun,
  type LevelEntity,
  type RunInput,
  type RunRules,
  type RunState,
} from "./run-simulation";

export interface ClockState {
  elapsedMs: number;
  paused: boolean;
}

export interface SyncedRun {
  lastSeenMs: number;
  state: RunState;
}

export function startSyncedRun(rules: RunRules): SyncedRun {
  return {
    lastSeenMs: 0,
    state: createRunState(rules),
  };
}

export function advanceSyncedRun(
  run: SyncedRun,
  clock: ClockState,
  input: RunInput,
  rules: RunRules,
  entities: readonly LevelEntity[],
): SyncedRun {
  if (clock.paused) {
    return { ...run, lastSeenMs: clock.elapsedMs };
  }

  if (clock.elapsedMs < run.lastSeenMs) {
    return startSyncedRun(rules);
  }

  const deltaMs = clock.elapsedMs - run.lastSeenMs;

  if (deltaMs === 0) {
    return run;
  }

  return {
    lastSeenMs: clock.elapsedMs,
    state: tickRun(run.state, input, deltaMs, rules, entities),
  };
}
