export interface RunRules {
  fallBoundaryY: number;
  gravity: number;
  horizontalSpeed: number;
  jumpVelocity: number;
  playerHeight: number;
  playerWidth: number;
  spawnY: number;
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

export type BlockShape = "rectangle" | "ramp-up" | "ramp-down";

export interface BlockEntity extends RectangularEntity {
  shape?: BlockShape;
  type: "block";
}

export interface DecorationEntity extends RectangularEntity {
  kind: "beam" | "diamond" | "pillar";
  type: "decoration";
}

export interface SpikeEntity extends RectangularEntity {
  type: "spike";
}

export type PlayerMode = "cube" | "ship";

export interface PortalEntity extends RectangularEntity {
  mode: PlayerMode;
  type: "portal";
}

export interface PadEntity extends RectangularEntity {
  id: string;
  impulse: number;
  type: "pad";
}

export type OrbEffect =
  | { kind: "impulse"; magnitude: number }
  | { kind: "kill" };

export interface OrbEntity extends RectangularEntity {
  effect: OrbEffect;
  id: string;
  type: "orb";
}

export type LevelEntity =
  | BlockEntity
  | DecorationEntity
  | OrbEntity
  | PadEntity
  | PortalEntity
  | SpikeEntity;
export type DeathCause = "block" | "fall" | "spike" | "trap";
export type RunStatus = "dead" | "running";

export interface PlayerState {
  grounded: boolean;
  mode: PlayerMode;
  velocityY: number;
  x: number;
  y: number;
}

export interface RunState {
  consumedTriggerIds: ReadonlySet<string>;
  deathCause?: DeathCause;
  elapsedMs: number;
  player: PlayerState;
  status: RunStatus;
}

export function createRunState(rules: RunRules): RunState {
  return {
    consumedTriggerIds: new Set(),
    elapsedMs: 0,
    player: {
      grounded: true,
      mode: "cube",
      velocityY: 0,
      x: 0,
      y: rules.spawnY,
    },
    status: "running",
  };
}

// Main-level runs deliberately have no checkpoint: a reset returns the
// run to its start regardless of how far the player progressed. Gauntlet
// stage progress lives separately in src/core/gauntlet.ts and uses a
// different policy (see GAUNTLET_CHECKPOINT_POLICY there).
export const MAIN_LEVEL_CHECKPOINT_POLICY = {
  preservesProgressOnRestart: false,
} as const;

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

  for (const entity of entities) {
    if (entity.type !== "block" || !overlapsHorizontally(proposedX, entity, rules)) {
      continue;
    }

    const currentSurfaceY = blockSurfaceY(entity, state.player.x, rules.playerWidth);
    const proposedSurfaceY = blockSurfaceY(entity, proposedX, rules.playerWidth);
    if (
      state.player.y <= currentSurfaceY + 0.01 &&
      proposedY >= proposedSurfaceY
    ) {
      surfaces.push(proposedSurfaceY);
    }
  }

  return surfaces.length > 0 ? Math.min(...surfaces) : undefined;
}

function playerOverlapsRect(
  playerX: number,
  playerY: number,
  entity: RectangularEntity,
  rules: RunRules,
): boolean {
  const playerTop = playerY - rules.playerHeight;
  const playerBottom = playerY;

  return (
    overlapsHorizontally(playerX, entity, rules) &&
    playerBottom > entity.y &&
    playerTop < entity.y + entity.height
  );
}

function blockSurfaceY(
  block: BlockEntity,
  playerX: number,
  playerWidth: number,
): number {
  const shape = block.shape ?? "rectangle";
  if (shape === "rectangle") {
    return block.y;
  }

  const contactX =
    shape === "ramp-up"
      ? playerX + playerWidth / 2
      : playerX - playerWidth / 2;
  const ratio = Math.max(0, Math.min(1, (contactX - block.x) / block.width));
  return shape === "ramp-up"
    ? block.y + block.height * (1 - ratio)
    : block.y + block.height * ratio;
}

function playerOverlapsBlock(
  playerX: number,
  playerY: number,
  block: BlockEntity,
  rules: RunRules,
): boolean {
  if ((block.shape ?? "rectangle") === "rectangle") {
    return playerOverlapsRect(playerX, playerY, block, rules);
  }

  const playerTop = playerY - rules.playerHeight;
  return (
    overlapsHorizontally(playerX, block, rules) &&
    playerY > blockSurfaceY(block, playerX, rules.playerWidth) &&
    playerTop < block.y + block.height
  );
}

interface CollisionPoint {
  x: number;
  y: number;
}

function projectionsOverlap(
  first: readonly CollisionPoint[],
  second: readonly CollisionPoint[],
  axis: CollisionPoint,
): boolean {
  const firstProjection = first.map((point) => point.x * axis.x + point.y * axis.y);
  const secondProjection = second.map((point) => point.x * axis.x + point.y * axis.y);
  return (
    Math.max(...firstProjection) > Math.min(...secondProjection) &&
    Math.max(...secondProjection) > Math.min(...firstProjection)
  );
}

function playerOverlapsSpike(
  playerX: number,
  playerY: number,
  spike: SpikeEntity,
  rules: RunRules,
): boolean {
  const left = playerX - rules.playerWidth / 2;
  const right = playerX + rules.playerWidth / 2;
  const top = playerY - rules.playerHeight;
  const bottom = playerY;
  const player = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  const triangle = [
    { x: spike.x, y: spike.y + spike.height },
    { x: spike.x + spike.width / 2, y: spike.y },
    { x: spike.x + spike.width, y: spike.y + spike.height },
  ];
  const axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    ...triangle.map((point, index) => {
      const next = triangle[(index + 1) % triangle.length];
      return { x: -(next.y - point.y), y: next.x - point.x };
    }),
  ];

  return axes.every((axis) => projectionsOverlap(player, triangle, axis));
}

type VelocityStrategy = (
  player: PlayerState,
  input: RunInput,
  elapsedSeconds: number,
  rules: RunRules,
) => number;

const VELOCITY_STRATEGIES: Record<PlayerMode, VelocityStrategy> = {
  cube: (player, _input, elapsedSeconds, rules) =>
    player.velocityY + rules.gravity * elapsedSeconds,
  ship: (player, input, elapsedSeconds, rules) => {
    const maxVelocity = Math.abs(rules.jumpVelocity) * 0.68;
    const acceleration = rules.gravity * (input.jumpPressed ? -0.86 : 0.68);
    const velocity = player.velocityY + acceleration * elapsedSeconds;
    return Math.max(-maxVelocity, Math.min(maxVelocity, velocity));
  },
};

function computeNextVelocityY(
  player: PlayerState,
  input: RunInput,
  elapsedSeconds: number,
  rules: RunRules,
): number {
  return VELOCITY_STRATEGIES[player.mode](player, input, elapsedSeconds, rules);
}

interface UpwardImpulse {
  magnitude: number;
}

function gatherImpulses(
  state: RunState,
  input: RunInput,
  activatablePads: readonly PadEntity[],
  activatedOrbs: readonly OrbEntity[],
  rules: RunRules,
): readonly UpwardImpulse[] {
  const impulses: UpwardImpulse[] = [
    ...activatablePads.map((pad) => ({ magnitude: pad.impulse })),
    ...activatedOrbs.flatMap((orb) =>
      orb.effect.kind === "impulse"
        ? [{ magnitude: orb.effect.magnitude }]
        : [],
    ),
  ];

  if (
    state.player.mode === "cube" &&
    state.player.grounded &&
    input.jumpPressed
  ) {
    impulses.push({ magnitude: Math.abs(rules.jumpVelocity) });
  }

  return impulses;
}

function applyStrongestImpulse(
  player: PlayerState,
  impulses: readonly UpwardImpulse[],
): PlayerState {
  if (impulses.length === 0) {
    return player;
  }

  const strongest = impulses.reduce((a, b) =>
    a.magnitude >= b.magnitude ? a : b,
  );

  return { ...player, grounded: false, velocityY: -strongest.magnitude };
}

function resolvePortalMode(
  currentMode: PlayerMode,
  playerX: number,
  playerY: number,
  entities: readonly LevelEntity[],
  rules: RunRules,
): PlayerMode {
  for (const entity of entities) {
    if (
      entity.type === "portal" &&
      playerOverlapsRect(playerX, playerY, entity, rules)
    ) {
      return entity.mode;
    }
  }

  return currentMode;
}

function isTriggerInContact<T extends RectangularEntity & { id: string }>(
  entity: T,
  player: PlayerState,
  consumedTriggerIds: ReadonlySet<string>,
  rules: RunRules,
): boolean {
  return (
    !consumedTriggerIds.has(entity.id) &&
    playerOverlapsRect(player.x, player.y, entity, rules)
  );
}

function findActivatablePads(
  player: PlayerState,
  consumedTriggerIds: ReadonlySet<string>,
  entities: readonly LevelEntity[],
  rules: RunRules,
): readonly PadEntity[] {
  return entities.filter(
    (entity): entity is PadEntity =>
      entity.type === "pad" &&
      isTriggerInContact(entity, player, consumedTriggerIds, rules),
  );
}

function findActivatableOrbs(
  player: PlayerState,
  consumedTriggerIds: ReadonlySet<string>,
  entities: readonly LevelEntity[],
  rules: RunRules,
): readonly OrbEntity[] {
  return entities.filter(
    (entity): entity is OrbEntity =>
      entity.type === "orb" &&
      isTriggerInContact(entity, player, consumedTriggerIds, rules),
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
  const activatablePads = findActivatablePads(
    state.player,
    state.consumedTriggerIds,
    entities,
    rules,
  );
  const activatedOrbs = input.jumpPressed
    ? findActivatableOrbs(
        state.player,
        state.consumedTriggerIds,
        entities,
        rules,
      )
    : [];
  const impulses = gatherImpulses(
    state,
    input,
    activatablePads,
    activatedOrbs,
    rules,
  );
  const playerForVelocity = applyStrongestImpulse(state.player, impulses);
  const velocityY = computeNextVelocityY(
    playerForVelocity,
    input,
    elapsedSeconds,
    rules,
  );
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
  const placedY = landed ? landingY : proposedY;
  const nextMode = resolvePortalMode(
    state.player.mode,
    proposedX,
    placedY,
    entities,
    rules,
  );
  const enteredShip = state.player.mode !== "ship" && nextMode === "ship";
  const player: PlayerState = {
    grounded: enteredShip ? false : landed,
    mode: nextMode,
    velocityY: enteredShip ? 0 : landed ? 0 : velocityY,
    x: proposedX,
    y: placedY,
  };
  const triggeredIds = [
    ...activatablePads.map((pad) => pad.id),
    ...activatedOrbs.map((orb) => orb.id),
  ];
  const nextConsumedTriggerIds: ReadonlySet<string> =
    triggeredIds.length > 0
      ? new Set([...state.consumedTriggerIds, ...triggeredIds])
      : state.consumedTriggerIds;
  const trapActivated = activatedOrbs.some(
    (orb) => orb.effect.kind === "kill",
  );
  const SURFACE_EPSILON = 1.25;
  const blockFatalCollision = entities.some((entity) => {
    if (entity.type !== "block") {
      return false;
    }
    if (!playerOverlapsBlock(player.x, player.y, entity, rules)) {
      return false;
    }
    const currentSurfaceY = blockSurfaceY(entity, player.x, rules.playerWidth);
    const onSurfaceNow =
      player.velocityY >= 0 &&
      Math.abs(player.y - currentSurfaceY) <= SURFACE_EPSILON;

    if (!onSurfaceNow) {
      return true;
    }

    const wasOverlapping = playerOverlapsBlock(
      state.player.x,
      state.player.y,
      entity,
      rules,
    );
    const previousSurfaceY = blockSurfaceY(
      entity,
      state.player.x,
      rules.playerWidth,
    );
    const wasOnOrAboveSurface =
      state.player.y <= previousSurfaceY + SURFACE_EPSILON;

    return !(wasOverlapping || wasOnOrAboveSurface);
  });
  const deathCause: DeathCause | undefined = trapActivated
    ? "trap"
    : entities.some(
          (entity) =>
            entity.type === "spike" &&
            playerOverlapsSpike(player.x, player.y, entity, rules),
        )
      ? "spike"
      : blockFatalCollision
        ? "block"
      : player.y >= rules.fallBoundaryY
        ? "fall"
        : undefined;

  return {
    consumedTriggerIds: nextConsumedTriggerIds,
    ...(deathCause ? { deathCause } : {}),
    elapsedMs: state.elapsedMs + elapsedMs,
    player,
    status: deathCause ? "dead" : "running",
  };
}
