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

export interface PlayableClock {
  pause(): void;
  read(): ClockState;
  reset(): void;
  resume(): void;
}

export interface ManualClock extends PlayableClock {
  advance(deltaMs: number): void;
  setElapsedMs(elapsedMs: number): void;
}

export interface AudioElementLike {
  currentTime: number;
  paused: boolean;
  pause(): void;
  play(): Promise<void> | void;
}

export function createAudioClock(audio: AudioElementLike): PlayableClock {
  return {
    pause() {
      audio.pause();
    },
    read() {
      return {
        elapsedMs: audio.currentTime * 1000,
        paused: audio.paused,
      };
    },
    reset() {
      audio.currentTime = 0;
    },
    resume() {
      void audio.play();
    },
  };
}

export function createManualClock(
  initial: ClockState = { elapsedMs: 0, paused: false },
): ManualClock {
  let state: ClockState = { ...initial };

  return {
    advance(deltaMs) {
      if (!state.paused) {
        state = { ...state, elapsedMs: state.elapsedMs + deltaMs };
      }
    },
    pause() {
      state = { ...state, paused: true };
    },
    read() {
      return { ...state };
    },
    reset() {
      state = { elapsedMs: 0, paused: false };
    },
    resume() {
      state = { ...state, paused: false };
    },
    setElapsedMs(elapsedMs) {
      state = { ...state, elapsedMs };
    },
  };
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
