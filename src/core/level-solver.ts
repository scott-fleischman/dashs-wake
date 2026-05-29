import type { LevelContent } from "../content/first-wake";
import {
  createRunState,
  tickRun,
  type LevelEntity,
  type OrbEntity,
  type PlayerMode,
  type PlayerState,
  type RunRules,
  type RunState,
} from "./run-simulation";

export const SOLVER_TICK_MS = 1000 / 60;
/** Enough horizon for the longest official track at paced horizontal speed. */
export const SOLVER_MAX_TICKS = 1800;
export const SOLVER_PRE_JUMP_DISTANCE = 52;

export interface LevelDemoFrame {
  mode: PlayerMode;
  velocityY: number;
  x: number;
  y: number;
}

export interface LevelDemo {
  frames: readonly LevelDemoFrame[];
  success: boolean;
  tickMs: number;
}

function aiOrbOverlap(
  player: PlayerState,
  entities: readonly LevelEntity[],
  rules: RunRules,
): OrbEntity | undefined {
  const playerLeft = player.x - rules.playerWidth / 2;
  const playerRight = player.x + rules.playerWidth / 2;
  const playerTop = player.y - rules.playerHeight;
  const playerBottom = player.y;

  for (const entity of entities) {
    if (entity.type !== "orb") {
      continue;
    }
    if (
      playerRight > entity.x &&
      playerLeft < entity.x + entity.width &&
      playerBottom > entity.y &&
      playerTop < entity.y + entity.height
    ) {
      return entity;
    }
  }

  return undefined;
}

/** Conservative autoplayer used for playability checks and reference demos. */
export function decideConservativeJump(
  state: RunState,
  entities: readonly LevelEntity[],
  rules: RunRules,
): boolean {
  if (state.player.mode === "ship") {
    const channelCenterY = rules.spawnY - rules.playerHeight * 1.7;
    return (
      state.player.y > channelCenterY ||
      (state.player.velocityY > 90 &&
        state.player.y > channelCenterY - rules.playerHeight)
    );
  }

  const overlappingOrb = aiOrbOverlap(state.player, entities, rules);

  if (overlappingOrb && overlappingOrb.effect.kind === "impulse") {
    if (overlappingOrb.id.includes("trap")) {
      return false;
    }
    return !state.consumedTriggerIds.has(overlappingOrb.id);
  }

  if (overlappingOrb && overlappingOrb.effect.kind === "kill") {
    return false;
  }

  if (!state.player.grounded) {
    return false;
  }

  const probeX = state.player.x + rules.playerWidth * 0.55;
  const hasSupportAhead = entities.some(
    (entity) =>
      entity.type === "block" &&
      Math.abs(entity.y - state.player.y) < 10 &&
      probeX >= entity.x &&
      probeX <= entity.x + entity.width,
  );
  if (!hasSupportAhead) {
    return true;
  }

  for (const entity of entities) {
    if (entity.type === "orb" && entity.effect.kind === "impulse") {
      if (entity.id.includes("trap")) {
        continue;
      }
      const distance = entity.x - state.player.x;
      if (
        distance > 0 &&
        distance < SOLVER_PRE_JUMP_DISTANCE * 2.6 &&
        entity.y + entity.height < state.player.y - 8
      ) {
        return true;
      }
    }
  }

  for (const entity of entities) {
    if (entity.type !== "spike" && entity.type !== "block") {
      continue;
    }

    const distance = entity.x - state.player.x;
    if (distance <= 0) {
      continue;
    }

    if (entity.type === "block") {
      const elevatedPlatform = entity.y < state.player.y - 6;
      const wallOrCeiling = entity.y >= state.player.y - 6;
      if (wallOrCeiling) {
        continue;
      }
      const approachDistance = elevatedPlatform
        ? SOLVER_PRE_JUMP_DISTANCE * 3.8
        : SOLVER_PRE_JUMP_DISTANCE * 2.2;
      if (distance < approachDistance) {
        return true;
      }
      continue;
    }

    if (entity.y > state.player.y - 12) {
      continue;
    }

    if (distance < SOLVER_PRE_JUMP_DISTANCE) {
      return true;
    }
  }

  return false;
}

export interface SolverRunResult {
  deathCause?: string;
  frames: readonly LevelDemoFrame[];
  reachedFinish: boolean;
  stoppedX: number;
}

export function simulateConservativeRun(level: LevelContent): SolverRunResult {
  const frames: LevelDemoFrame[] = [];
  let state = createRunState(level.rules);

  for (let tick = 0; tick < SOLVER_MAX_TICKS; tick += 1) {
    frames.push({
      mode: state.player.mode,
      velocityY: state.player.velocityY,
      x: state.player.x,
      y: state.player.y,
    });

    if (state.status === "dead") {
      return {
        deathCause: state.deathCause ?? "unknown",
        frames,
        reachedFinish: false,
        stoppedX: Math.round(state.player.x),
      };
    }

    if (state.player.x >= level.finishX) {
      return {
        frames,
        reachedFinish: true,
        stoppedX: Math.round(state.player.x),
      };
    }

    const jumpPressed = decideConservativeJump(
      state,
      level.entities,
      level.rules,
    );
    state = tickRun(
      state,
      { jumpPressed },
      SOLVER_TICK_MS,
      level.rules,
      level.entities,
    );
  }

  return {
    frames,
    reachedFinish: false,
    stoppedX: Math.round(state.player.x),
  };
}

export function recordConservativeDemo(level: LevelContent): LevelDemo {
  const result = simulateConservativeRun(level);
  return {
    frames: result.frames,
    success: result.reachedFinish,
    tickMs: SOLVER_TICK_MS,
  };
}
