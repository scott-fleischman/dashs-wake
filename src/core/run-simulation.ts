export interface RunRules {
  fallBoundaryY: number;
  gravity: number;
  groundY: number;
  horizontalSpeed: number;
  jumpVelocity: number;
  playerHeight: number;
  playerWidth: number;
}

export interface RunInput {
  jumpPressed: boolean;
}

interface RectangularEntity {
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface PlatformEntity extends RectangularEntity {
  type: "platform";
}

export interface SpikeEntity extends RectangularEntity {
  type: "spike";
}

export interface GapEntity {
  type: "gap";
  width: number;
  x: number;
}

export type LevelEntity = GapEntity | PlatformEntity | SpikeEntity;
export type DeathCause = "fall" | "spike";
export type RunStatus = "dead" | "running";

export interface PlayerState {
  grounded: boolean;
  velocityY: number;
  x: number;
  y: number;
}

export interface RunState {
  deathCause?: DeathCause;
  elapsedMs: number;
  player: PlayerState;
  status: RunStatus;
}

export function createRunState(rules: RunRules): RunState {
  return {
    elapsedMs: 0,
    player: {
      grounded: true,
      velocityY: 0,
      x: 0,
      y: rules.groundY,
    },
    status: "running",
  };
}

export function resetRunState(_state: RunState, rules: RunRules): RunState {
  return createRunState(rules);
}

function overlapsHorizontally(
  playerX: number,
  entity: Pick<LevelEntity, "width" | "x">,
  rules: RunRules,
): boolean {
  const playerLeft = playerX - rules.playerWidth / 2;
  const playerRight = playerX + rules.playerWidth / 2;

  return playerRight > entity.x && playerLeft < entity.x + entity.width;
}

function supportsPlayerAtGround(
  playerX: number,
  entities: readonly LevelEntity[],
  rules: RunRules,
): boolean {
  return !entities.some(
    (entity) =>
      entity.type === "gap" && overlapsHorizontally(playerX, entity, rules),
  );
}

function resolveLandingY(
  state: RunState,
  proposedX: number,
  proposedY: number,
  velocityY: number,
  entities: readonly LevelEntity[],
  rules: RunRules,
): number | undefined {
  if (velocityY < 0) {
    return undefined;
  }

  const surfaces: number[] = [];

  if (
    proposedY >= rules.groundY &&
    supportsPlayerAtGround(proposedX, entities, rules)
  ) {
    surfaces.push(rules.groundY);
  }

  for (const entity of entities) {
    if (
      entity.type === "platform" &&
      state.player.y <= entity.y &&
      proposedY >= entity.y &&
      overlapsHorizontally(proposedX, entity, rules)
    ) {
      surfaces.push(entity.y);
    }
  }

  return surfaces.length > 0 ? Math.min(...surfaces) : undefined;
}

function touchesSpike(
  player: PlayerState,
  entity: SpikeEntity,
  rules: RunRules,
): boolean {
  const playerTop = player.y - rules.playerHeight;
  const playerBottom = player.y;

  return (
    overlapsHorizontally(player.x, entity, rules) &&
    playerBottom > entity.y &&
    playerTop < entity.y + entity.height
  );
}

export function tickRun(
  state: RunState,
  input: RunInput,
  elapsedMs: number,
  rules: RunRules,
  entities: readonly LevelEntity[] = [],
): RunState {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) {
    throw new RangeError("Run tick elapsed time must be a non-negative finite value.");
  }

  if (state.status === "dead") {
    return state;
  }

  const elapsedSeconds = elapsedMs / 1000;
  const launchVelocity =
    input.jumpPressed && state.player.grounded
      ? rules.jumpVelocity
      : state.player.velocityY;
  const velocityY = launchVelocity + rules.gravity * elapsedSeconds;
  const proposedX = state.player.x + rules.horizontalSpeed * elapsedSeconds;
  const proposedY = state.player.y + velocityY * elapsedSeconds;
  const landingY = resolveLandingY(
    state,
    proposedX,
    proposedY,
    velocityY,
    entities,
    rules,
  );
  const landed = landingY !== undefined;
  const player: PlayerState = {
    grounded: landed,
    velocityY: landed ? 0 : velocityY,
    x: proposedX,
    y: landed ? landingY : proposedY,
  };
  const deathCause = entities.some(
    (entity) => entity.type === "spike" && touchesSpike(player, entity, rules),
  )
    ? "spike"
    : player.y >= rules.fallBoundaryY
      ? "fall"
      : undefined;

  return {
    ...(deathCause ? { deathCause } : {}),
    elapsedMs: state.elapsedMs + elapsedMs,
    player,
    status: deathCause ? "dead" : "running",
  };
}
