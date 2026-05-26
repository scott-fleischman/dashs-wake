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

export interface BlockEntity extends RectangularEntity {
  type: "block";
}

export interface DecorationEntity extends RectangularEntity {
  kind: "beam" | "diamond" | "pillar";
  type: "decoration";
}

export interface SpikeEntity extends RectangularEntity {
  type: "spike";
}

export interface GapEntity {
  type: "gap";
  width: number;
  x: number;
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
  | GapEntity
  | OrbEntity
  | PadEntity
  | PlatformEntity
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
      y: rules.groundY,
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
      (entity.type === "platform" || entity.type === "block") &&
      state.player.y <= entity.y &&
      proposedY >= entity.y &&
      overlapsHorizontally(proposedX, entity, rules)
    ) {
      surfaces.push(entity.y);
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
    const acceleration = input.jumpPressed ? -rules.gravity : rules.gravity;
    return player.velocityY + acceleration * elapsedSeconds;
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
  const player: PlayerState = {
    grounded: landed,
    mode: nextMode,
    velocityY: landed ? 0 : velocityY,
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
  const deathCause: DeathCause | undefined = trapActivated
    ? "trap"
    : entities.some(
          (entity) =>
            entity.type === "spike" &&
            playerOverlapsRect(player.x, player.y, entity, rules),
        )
      ? "spike"
      : entities.some(
            (entity) =>
              entity.type === "block" &&
              playerOverlapsRect(player.x, player.y, entity, rules),
          )
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
