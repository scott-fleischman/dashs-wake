import type {
  LevelEntity,
  PortalEntity,
  RunRules,
} from "../core/run-simulation";

export interface BeatMap {
  beats: readonly number[];
  durationMs: number;
}

export interface LevelContent {
  beatMap: BeatMap;
  entities: readonly LevelEntity[];
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
  horizontalSpeed: 190,
  jumpVelocity: -540,
  playerHeight: 34,
  playerWidth: 34,
};

const FIRST_WAKE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  { type: "spike", height: 30, width: 30, x: 425, y: 270 },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 500, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 740, y: 220 },
];

const FIRST_WAKE_FINISH_X = 820;

function buildPlaceholderBeatMap(
  finishX: number,
  horizontalSpeed: number,
): BeatMap {
  const traversalMs = Math.ceil((finishX / horizontalSpeed) * 1000);
  const durationMs = traversalMs + 600;
  const intervalMs = 600;
  const beats: number[] = [];

  for (let timeMs = 0; timeMs <= durationMs; timeMs += intervalMs) {
    beats.push(timeMs);
  }

  return { beats, durationMs };
}

export const firstWakeLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    FIRST_WAKE_FINISH_X,
    FIRST_WAKE_RULES.horizontalSpeed,
  ),
  entities: FIRST_WAKE_ENTITIES,
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

const LEVEL_VALIDATORS: readonly LevelValidator[] = [
  validateHazardReachability,
  validateEntityBounds,
  validateShipCorridors,
];

export function validateLevelReachability(level: LevelContent): ValidationResult {
  const issues = LEVEL_VALIDATORS.flatMap((validator) => validator(level));

  return { issues, ok: issues.length === 0 };
}
