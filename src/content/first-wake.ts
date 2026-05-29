import type { LevelEntity, PortalEntity, RunRules } from "../core/run-simulation";
import {
  assembleOfficialLevel,
  type BeatMap,
  type ExpectedRoute,
  type LevelContent,
} from "./official-course";
import type { FlightChannel } from "./terrain";

export type { BeatMap, ExpectedRoute, LevelContent };

export interface ValidationResult {
  issues: readonly string[];
  ok: boolean;
}

const MIN_SHIP_CORRIDOR_WIDTH_RATIO = 5;

const FIRST_WAKE_FINISH_X = 4_900;

const FIRST_WAKE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 380, y: 270 },
  { type: "block", shape: "ramp-up", height: 70, width: 90, x: 580, y: 230 },
  { type: "block", height: 70, width: 160, x: 670, y: 230 },
  { type: "block", shape: "ramp-down", height: 70, width: 90, x: 830, y: 230 },
  { type: "spike", height: 30, width: 30, x: 1_120, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1_150, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1_180, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1_520, y: 270 },
  { type: "portal", mode: "ship", height: 320, width: 12, x: 1_920, y: 36 },
  { type: "portal", mode: "cube", height: 320, width: 12, x: 2_420, y: 36 },
  { type: "portal", mode: "ship", height: 320, width: 12, x: 2_520, y: 36 },
  { type: "portal", mode: "cube", height: 320, width: 12, x: 3_520, y: 36 },
  { type: "spike", height: 30, width: 30, x: 3_720, y: 270 },
  { type: "spike", height: 30, width: 30, x: 4_120, y: 270 },
];

const FIRST_WAKE_CHANNELS: readonly FlightChannel[] = [
  {
    startX: 1_860,
    endX: 2_480,
    ceilingBottomY: 96,
    lowerSurfaceY: 388,
  },
  {
    startX: 2_460,
    endX: 3_580,
    ceilingBottomY: 96,
    lowerSurfaceY: 388,
  },
];

export const firstWakeLevel: LevelContent = assembleOfficialLevel(
  "level_1",
  FIRST_WAKE_ENTITIES,
  FIRST_WAKE_FINISH_X,
  FIRST_WAKE_CHANNELS,
);

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

const validatePadSpikeTraps: LevelValidator = (level) => {
  const issues: string[] = [];
  const spikes = level.entities.filter((entity) => entity.type === "spike");
  const pads = level.entities.filter((entity) => entity.type === "pad");

  for (const pad of pads) {
    for (const spike of spikes) {
      const gap = pad.x - (spike.x + spike.width);
      if (gap >= 0 && gap < 64) {
        issues.push(
          `Launch pad at x=${pad.x} sits ${gap}px after a spike — likely an unavoidable bounce trap.`,
        );
      }
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
        (entity): entity is import("../core/run-simulation").OrbEntity | import("../core/run-simulation").PadEntity =>
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
  validatePadSpikeTraps,
  validateRequiredTriggers,
];

export function validateLevelReachability(level: LevelContent): ValidationResult {
  const issues = LEVEL_VALIDATORS.flatMap((validator) => validator(level));

  return { issues, ok: issues.length === 0 };
}
