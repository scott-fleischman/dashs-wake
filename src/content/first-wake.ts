import type {
  LevelEntity,
  OrbEntity,
  PadEntity,
  PortalEntity,
  RunRules,
} from "../core/run-simulation";
import {
  paceAuthoredEntities,
  paceAuthoredX,
  PLAYER_HORIZONTAL_SPEED,
} from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import {
  SPAWN_SURFACE_Y,
  withSupportingTerrain,
  type FlightChannel,
} from "./terrain";

export interface BeatMap {
  beats: readonly number[];
  durationMs: number;
}

export interface ExpectedRoute {
  requiredTriggerIds: readonly string[];
}

export interface LevelContent {
  beatMap: BeatMap;
  entities: readonly LevelEntity[];
  expectedRoute?: ExpectedRoute;
  finishX: number;
  rules: RunRules;
}

export interface ValidationResult {
  issues: readonly string[];
  ok: boolean;
}

const MIN_SHIP_CORRIDOR_WIDTH_RATIO = 5;

const FIRST_WAKE_RULES: RunRules = {
  fallBoundaryY: 500,
  gravity: 1250,
  horizontalSpeed: PLAYER_HORIZONTAL_SPEED,
  jumpVelocity: -430,
  playerHeight: 34,
  playerWidth: 34,
  spawnY: SPAWN_SURFACE_Y,
};

const FIRST_WAKE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 190, y: 270 },
  { type: "spike", height: 30, width: 30, x: 455, y: 270 },
  { type: "portal", mode: "ship", height: 374, width: 12, x: 650, y: 36 },
  { type: "portal", mode: "cube", height: 374, width: 12, x: 1020, y: 36 },
  { type: "spike", height: 30, width: 30, x: 1450, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1690, y: 270 },
  { type: "portal", mode: "ship", height: 374, width: 12, x: 1920, y: 36 },
  { type: "portal", mode: "cube", height: 374, width: 12, x: 2320, y: 36 },
  { type: "spike", height: 30, width: 30, x: 2790, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3080, y: 270 },
];

const FIRST_WAKE_FINISH_X = paceAuthoredX(3918);
const FIRST_WAKE_FLIGHT_CHANNELS: readonly FlightChannel[] = [
  {
    startX: paceAuthoredX(620),
    endX: paceAuthoredX(1020) + 240,
    ceilingEndX: paceAuthoredX(1020) + 18,
    lowerSurfaceY: 330,
  },
  {
    startX: paceAuthoredX(1890),
    endX: paceAuthoredX(2320) + 240,
    ceilingEndX: paceAuthoredX(2320) + 18,
    lowerSurfaceY: 330,
  },
];

export const firstWakeLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_1"),
  entities: withSupportingTerrain(
    paceAuthoredEntities(FIRST_WAKE_ENTITIES),
    FIRST_WAKE_FINISH_X,
    FIRST_WAKE_FLIGHT_CHANNELS,
  ),
  finishX: FIRST_WAKE_FINISH_X,
  rules: FIRST_WAKE_RULES,
};

function maxJumpDistance(rules: RunRules): number {
  const airtimeSeconds = (2 * Math.abs(rules.jumpVelocity)) / rules.gravity;
  return rules.horizontalSpeed * airtimeSeconds;
}

type LevelValidator = (level: LevelContent) => readonly string[];

const validateHazardReachability: LevelValidator = (level) => {
  const issues: string[] = [];
  const maxJump = maxJumpDistance(level.rules);

  for (const entity of level.entities) {
    if (entity.type === "spike" && entity.width >= maxJump) {
      issues.push(
        `Spike at x=${entity.x} is wider than the max jump (${entity.width} >= ${maxJump.toFixed(2)}).`,
      );
    }
  }

  return issues;
};

const validateEntityBounds: LevelValidator = (level) => {
  const issues: string[] = [];

  for (const entity of level.entities) {
    if (entity.x + entity.width > level.finishX) {
      issues.push(
        `Entity at x=${entity.x} extends past the finish line x=${level.finishX}.`,
      );
    }
  }

  return issues;
};

const validateSpawnSupport: LevelValidator = (level) => {
  const spawnSupported = level.entities.some(
    (entity) =>
      entity.type === "block" &&
      entity.y === level.rules.spawnY &&
      entity.x <= level.rules.playerWidth / 2 &&
      entity.x + entity.width > -level.rules.playerWidth / 2,
  );

  return spawnSupported
    ? []
    : ["The player spawn has no supporting block terrain."];
};

const validateShipCorridors: LevelValidator = (level) => {
  const issues: string[] = [];
  const minCorridorWidth =
    MIN_SHIP_CORRIDOR_WIDTH_RATIO * level.rules.playerWidth;
  const shipPortals = level.entities
    .filter(
      (entity): entity is PortalEntity =>
        entity.type === "portal" && entity.mode === "ship",
    )
    .slice()
    .sort((a, b) => a.x - b.x);
  const cubePortals = level.entities
    .filter(
      (entity): entity is PortalEntity =>
        entity.type === "portal" && entity.mode === "cube",
    )
    .slice()
    .sort((a, b) => a.x - b.x);

  for (const shipPortal of shipPortals) {
    const nextCubePortal = cubePortals.find(
      (portal) => portal.x > shipPortal.x,
    );

    if (!nextCubePortal) {
      issues.push(
        `Ship corridor starting at x=${shipPortal.x} has no cube portal exit.`,
      );
      continue;
    }

    const corridorWidth = nextCubePortal.x - shipPortal.x;

    if (corridorWidth < minCorridorWidth) {
      issues.push(
        `Ship corridor at x=${shipPortal.x} is too tight (${corridorWidth} < ${minCorridorWidth}).`,
      );
    }

    const corridorBlocks = level.entities.filter(
      (entity) =>
        entity.type === "block" &&
        entity.x < nextCubePortal.x &&
        entity.x + entity.width > shipPortal.x,
    );
    const hasCeiling = corridorBlocks.some(
      (block) =>
        block.y + block.height <=
        level.rules.spawnY - level.rules.playerHeight,
    );
    const hasLowerWall = corridorBlocks.some(
      (block) => block.y > level.rules.spawnY,
    );

    if (!hasCeiling || !hasLowerWall) {
      issues.push(
        `Ship corridor at x=${shipPortal.x} must be bounded by upper and lower blocks.`,
      );
    }
  }

  return issues;
};

const validateRequiredTriggers: LevelValidator = (level) => {
  const route = level.expectedRoute;

  if (!route) {
    return [];
  }

  const issues: string[] = [];
  const triggerIds = new Set(
    level.entities
      .filter(
        (entity): entity is OrbEntity | PadEntity =>
          entity.type === "orb" || entity.type === "pad",
      )
      .map((trigger) => trigger.id),
  );

  for (const requiredId of route.requiredTriggerIds) {
    if (!triggerIds.has(requiredId)) {
      issues.push(
        `Required trigger "${requiredId}" is missing from the level entities.`,
      );
    }
  }

  return issues;
};

const LEVEL_VALIDATORS: readonly LevelValidator[] = [
  validateHazardReachability,
  validateEntityBounds,
  validateSpawnSupport,
  validateShipCorridors,
  validateRequiredTriggers,
];

export function validateLevelReachability(level: LevelContent): ValidationResult {
  const issues = LEVEL_VALIDATORS.flatMap((validator) => validator(level));

  return { issues, ok: issues.length === 0 };
}
