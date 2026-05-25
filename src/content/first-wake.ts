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
  fallBoundaryY: 420,
  gravity: 1250,
  groundY: 300,
  horizontalSpeed: PLAYER_HORIZONTAL_SPEED,
  jumpVelocity: -540,
  playerHeight: 34,
  playerWidth: 34,
};

const FIRST_WAKE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 190, y: 270 },
  { type: "spike", height: 30, width: 30, x: 455, y: 270 },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 650, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 1020, y: 220 },
  { type: "spike", height: 30, width: 30, x: 1190, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1450, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1690, y: 270 },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 1920, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 2320, y: 220 },
  { type: "spike", height: 30, width: 30, x: 2520, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2790, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3080, y: 270 },
];

const FIRST_WAKE_FINISH_X = 3918;

export const firstWakeLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_1"),
  entities: paceAuthoredEntities(FIRST_WAKE_ENTITIES),
  finishX: paceAuthoredX(FIRST_WAKE_FINISH_X),
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
    if (entity.type === "gap" && entity.width >= maxJump) {
      issues.push(
        `Gap at x=${entity.x} is wider than the max jump (${entity.width} >= ${maxJump.toFixed(2)}).`,
      );
    }

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
  validateShipCorridors,
  validateRequiredTriggers,
];

export function validateLevelReachability(level: LevelContent): ValidationResult {
  const issues = LEVEL_VALIDATORS.flatMap((validator) => validator(level));

  return { issues, ok: issues.length === 0 };
}
