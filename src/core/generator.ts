import {
  firstWakeLevel,
  type BeatMap,
  type LevelContent,
} from "../content/first-wake";
import {
  createRunState,
  tickRun,
  type LevelEntity,
  type OrbEntity,
  type PlayerState,
  type RunRules,
  type RunState,
} from "./run-simulation";
import { buildSupportingTerrain } from "../content/terrain";

export type Intensity = "intense" | "quiet";

export interface GeneratorInput {
  beatIntensities?: readonly Intensity[];
  beatMap: BeatMap;
  difficulty:
    | "easy"
    | "normal"
    | "hard"
    | "harder"
    | "insane"
    | "demon"
    | "nightmare";
  subRank?: "bronze" | "gold" | "diamond" | "void";
  theme?: "electric" | "forest" | "sunset" | "void";
  seed: number;
}

export type RandomSource = () => number;

export function mulberry32(seed: number): RandomSource {
  let t = seed | 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE_PLACE_THRESHOLD = 0.4;
const MIN_GAMEPLAY_PIECE_SPACING = 220;

export interface BeatContext {
  beatMs: number;
  difficulty: GeneratorInput["difficulty"];
  horizontalSpeed: number;
  intensity: Intensity;
  random: number;
  subRank: NonNullable<GeneratorInput["subRank"]>;
}

export type PatternId =
  | "block"
  | "block-high"
  | "fog"
  | "flash"
  | "orb"
  | "pad"
  | "portal-cube"
  | "portal-ship"
  | "ramp-down"
  | "ramp-up"
  | "spike"
  | "spike-ceiling"
  | "trap-orb";

export type BeatSelection =
  | { type: "skip" }
  | { type: "block"; x: number }
  | { type: "block-high"; x: number }
  | { type: "fog"; x: number }
  | { type: "flash"; x: number }
  | { type: "orb"; x: number }
  | { type: "pad"; x: number }
  | { type: "portal-cube"; x: number }
  | { type: "portal-ship"; x: number }
  | { type: "ramp-down"; x: number }
  | { type: "ramp-up"; x: number }
  | { type: "spike"; x: number }
  | { type: "spike-ceiling"; x: number }
  | { type: "trap-orb"; x: number };

interface PatternProduceArgs {
  beatIndex: number;
  x: number;
}

interface PatternCapability {
  id: PatternId;
  minDifficulty: GeneratorInput["difficulty"];
  produce: (args: PatternProduceArgs) => LevelEntity;
  requiresIntensity: Intensity;
}

const DIFFICULTY_RANK: Record<GeneratorInput["difficulty"], number> = {
  easy: 0,
  normal: 1,
  hard: 2,
  harder: 3,
  insane: 4,
  demon: 5,
  nightmare: 6,
};

const PATTERN_CAPABILITIES: readonly PatternCapability[] = [
  {
    id: "spike",
    minDifficulty: "normal",
    requiresIntensity: "intense",
    produce: ({ x }) => ({ type: "spike", height: 30, width: 30, x, y: 270 }),
  },
  {
    id: "spike-ceiling",
    minDifficulty: "harder",
    requiresIntensity: "intense",
    produce: ({ x }) => ({ type: "spike", height: 30, width: 30, x, y: 96 }),
  },
  {
    id: "block",
    minDifficulty: "normal",
    requiresIntensity: "intense",
    produce: ({ x }) => ({
      type: "block",
      height: 54,
      width: 54,
      x,
      y: 246,
    }),
  },
  {
    id: "block-high",
    minDifficulty: "hard",
    requiresIntensity: "intense",
    produce: ({ x }) => ({
      type: "block",
      height: 54,
      width: 60,
      x,
      y: 202,
    }),
  },
  {
    id: "ramp-up",
    minDifficulty: "hard",
    requiresIntensity: "quiet",
    produce: ({ x }) => ({
      type: "block",
      shape: "ramp-up",
      height: 72,
      width: 110,
      x,
      y: 228,
    }),
  },
  {
    id: "ramp-down",
    minDifficulty: "hard",
    requiresIntensity: "quiet",
    produce: ({ x }) => ({
      type: "block",
      shape: "ramp-down",
      height: 72,
      width: 110,
      x,
      y: 228,
    }),
  },
  {
    id: "pad",
    minDifficulty: "hard",
    requiresIntensity: "intense",
    produce: ({ beatIndex, x }) => ({
      type: "pad",
      id: `generated-pad-${beatIndex}`,
      impulse: 720,
      height: 18,
      width: 40,
      x,
      y: 290,
    }),
  },
  {
    id: "orb",
    minDifficulty: "insane",
    requiresIntensity: "intense",
    produce: ({ beatIndex, x }) => ({
      type: "orb",
      id: `generated-orb-${beatIndex}`,
      effect: { kind: "impulse", magnitude: 720 },
      height: 76,
      width: 62,
      x,
      y: 174,
    }),
  },
  {
    id: "portal-ship",
    minDifficulty: "harder",
    requiresIntensity: "quiet",
    produce: ({ x }) => ({
      type: "portal",
      mode: "ship",
      height: 360,
      width: 12,
      x,
      y: 36,
    }),
  },
  {
    id: "portal-cube",
    minDifficulty: "harder",
    requiresIntensity: "intense",
    produce: ({ x }) => ({
      type: "portal",
      mode: "cube",
      height: 360,
      width: 12,
      x,
      y: 36,
    }),
  },
  {
    id: "trap-orb",
    minDifficulty: "demon",
    requiresIntensity: "intense",
    produce: ({ beatIndex, x }) => ({
      type: "orb",
      id: `generated-trap-orb-${beatIndex}`,
      effect: { kind: "kill" },
      height: 76,
      width: 62,
      x,
      y: 174,
    }),
  },
  {
    id: "fog",
    minDifficulty: "easy",
    requiresIntensity: "quiet",
    produce: ({ x }) => ({
      type: "decoration",
      kind: "fog",
      height: 100,
      width: 180,
      x,
      y: 76,
    }),
  },
  {
    id: "flash",
    minDifficulty: "normal",
    requiresIntensity: "intense",
    produce: ({ x }) => ({
      type: "decoration",
      kind: "flash",
      height: 82,
      width: 150,
      x,
      y: 112,
    }),
  },
];

function findCapability(id: PatternId): PatternCapability | undefined {
  return PATTERN_CAPABILITIES.find((capability) => capability.id === id);
}

function hasGameplaySpacing(
  candidateX: number,
  entities: readonly LevelEntity[],
  minSpacing: number,
): boolean {
  return entities.every(
    (entity) =>
      entity.type === "decoration" ||
      Math.abs(entity.x - candidateX) >= minSpacing,
  );
}

const SUBRANK_MULTIPLIER = {
  bronze: 0.85,
  gold: 1,
  diamond: 1.15,
  void: 1.3,
} as const;

function effectivePlaceThreshold(subRank: NonNullable<GeneratorInput["subRank"]>): number {
  return Math.min(0.75, BASE_PLACE_THRESHOLD * SUBRANK_MULTIPLIER[subRank]);
}

function effectiveMinSpacing(subRank: NonNullable<GeneratorInput["subRank"]>): number {
  const ratio = 1.2 - (SUBRANK_MULTIPLIER[subRank] - 0.85);
  return Math.max(140, Math.round(MIN_GAMEPLAY_PIECE_SPACING * ratio));
}

export function permittedPatterns(
  intensity: Intensity,
  difficulty: GeneratorInput["difficulty"],
): readonly PatternId[] {
  const rank = DIFFICULTY_RANK[difficulty];

  return PATTERN_CAPABILITIES.filter(
    (capability) =>
      capability.requiresIntensity === intensity &&
      DIFFICULTY_RANK[capability.minDifficulty] <= rank,
  ).map((capability) => capability.id);
}

export function selectBeatPattern(context: BeatContext): BeatSelection {
  const permitted = permittedPatterns(context.intensity, context.difficulty);

  if (permitted.length === 0) {
    return { type: "skip" };
  }

  if (context.random >= effectivePlaceThreshold(context.subRank)) {
    return { type: "skip" };
  }

  const x = Math.round((context.beatMs / 1000) * context.horizontalSpeed);

  if (x === 0) {
    return { type: "skip" };
  }

  const slotWidth = effectivePlaceThreshold(context.subRank) / permitted.length;
  const idx = Math.min(
    permitted.length - 1,
    Math.floor(context.random / slotWidth),
  );
  const patternId = permitted[idx]!;

  return { type: patternId, x };
}

export function generateLevel(input: GeneratorInput): LevelContent {
  const rng = mulberry32(input.seed);
  const subRank = input.subRank ?? "bronze";
  const rules = firstWakeLevel.rules;
  const entities: LevelEntity[] = [];
  const finishX = Math.round((input.beatMap.durationMs / 1000) * rules.horizontalSpeed);
  const minSpacing = effectiveMinSpacing(subRank);

  for (let index = 0; index < input.beatMap.beats.length; index += 1) {
    const beatMs = input.beatMap.beats[index]!;
    const prev = input.beatMap.beats[index - 1];
    const next = input.beatMap.beats[index + 1];
    const localGapMs =
      prev !== undefined && next !== undefined
        ? (next - prev) / 2
        : next !== undefined
          ? next - beatMs
          : prev !== undefined
            ? beatMs - prev
            : 500;
    const baseIntensity = input.beatIntensities?.[index] ?? "intense";
    const intensity: Intensity =
      baseIntensity === "intense" || localGapMs < 430 ? "intense" : "quiet";
    const selection = selectBeatPattern({
      beatMs,
      difficulty: input.difficulty,
      horizontalSpeed: rules.horizontalSpeed,
      intensity,
      random: rng(),
      subRank,
    });

    if (index > 0 && index % 4 === 0) {
      entities.push({
        type: "decoration",
        kind: index % 8 === 0 ? "diamond" : "beam",
        height: 72,
        width: 44,
        x: Math.round((beatMs / 1000) * rules.horizontalSpeed),
        y: 116,
      });
    }

    if (selection.type === "skip") {
      continue;
    }

    const capability = findCapability(selection.type);

    if (capability) {
      const candidate = capability.produce({ beatIndex: index, x: selection.x });
      if (hasGameplaySpacing(candidate.x, entities, minSpacing)) {
        entities.push(candidate);
      }
    }
  }

  if (
    DIFFICULTY_RANK[input.difficulty] >= DIFFICULTY_RANK.normal &&
    !entities.some((entity) => entity.type === "block")
  ) {
    const availableBeat = input.beatMap.beats
      .slice(1)
      .map((beatMs) => Math.round((beatMs / 1000) * rules.horizontalSpeed))
      .find((x) => hasGameplaySpacing(x, entities, minSpacing));
    if (availableBeat !== undefined) {
      entities.push({
        type: "block",
        height: 54,
        width: 54,
        x: availableBeat,
        y: 246,
      });
    }
  }

  return {
    beatMap: input.beatMap,
    entities: [...buildSupportingTerrain(finishX), ...entities],
    finishX,
    rules,
  };
}

const AI_TICK_MS = 1000 / 60;
const AI_MAX_TICKS = 1500;
const AI_PRE_JUMP_DISTANCE = 40;

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

function decideAiInput(
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
    return !state.consumedTriggerIds.has(overlappingOrb.id);
  }

  if (overlappingOrb && overlappingOrb.effect.kind === "kill") {
    return false;
  }

  if (!state.player.grounded) {
    return false;
  }

  for (const entity of entities) {
    if (entity.type !== "spike" && entity.type !== "block") {
      continue;
    }
    if (entity.type === "block" && entity.y >= state.player.y) {
      continue;
    }
    const distance = entity.x - state.player.x;
    const approachDistance =
      entity.type === "block" ? AI_PRE_JUMP_DISTANCE * 2.2 : AI_PRE_JUMP_DISTANCE;
    if (distance > 0 && distance < approachDistance) {
      return true;
    }
  }

  return false;
}

export type PlayabilityIssueCode =
  | "ai-died"
  | "finish-not-reached";

export interface PlayabilityIssue {
  code: PlayabilityIssueCode;
  deathCause?: string;
  message: string;
  x: number;
}

export interface PlayabilityValidationResult {
  issues: readonly PlayabilityIssue[];
  ok: boolean;
}

export interface DifficultyAnalysis {
  estimatedDifficulty: number;
  estimatedLabel: GeneratorInput["difficulty"];
  obstacleDensityPer1000: number;
  peakPrecisionFrames: number;
  shipSectionRatio: number;
}

function labelForScore(score: number): GeneratorInput["difficulty"] {
  if (score < 20) return "easy";
  if (score < 34) return "normal";
  if (score < 48) return "hard";
  if (score < 60) return "harder";
  if (score < 73) return "insane";
  if (score < 86) return "demon";
  return "nightmare";
}

export function analyzeLevelDifficulty(level: LevelContent): DifficultyAnalysis {
  const obstacleCount = level.entities.filter(
    (entity) =>
      entity.type === "spike" ||
      entity.type === "block" ||
      entity.type === "orb" ||
      entity.type === "pad",
  ).length;
  const obstacleDensityPer1000 = obstacleCount / Math.max(1, level.finishX / 1000);
  const sortedHazards = level.entities
    .filter((entity) => entity.type === "spike" || entity.type === "block")
    .slice()
    .sort((a, b) => a.x - b.x);
  let tightestGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sortedHazards.length; i += 1) {
    tightestGap = Math.min(tightestGap, sortedHazards[i]!.x - sortedHazards[i - 1]!.x);
  }
  const peakPrecisionFrames =
    Number.isFinite(tightestGap) && tightestGap > 0
      ? Math.max(1, Math.round((tightestGap / level.rules.horizontalSpeed) * 60))
      : 30;
  const shipPortals = level.entities.filter(
    (entity) => entity.type === "portal" && entity.mode === "ship",
  ).length;
  const cubePortals = level.entities.filter(
    (entity) => entity.type === "portal" && entity.mode === "cube",
  ).length;
  const shipSectionRatio = shipPortals / Math.max(1, shipPortals + cubePortals);
  const estimatedDifficulty = Math.max(
    0,
    Math.min(
      100,
      obstacleDensityPer1000 * 4.2 +
        (30 / peakPrecisionFrames) * 18 +
        shipSectionRatio * 24,
    ),
  );
  return {
    estimatedDifficulty,
    estimatedLabel: labelForScore(estimatedDifficulty),
    obstacleDensityPer1000,
    peakPrecisionFrames,
    shipSectionRatio,
  };
}

export function validateGeneratedPlayability(
  level: LevelContent,
): PlayabilityValidationResult {
  let state = createRunState(level.rules);

  for (let tick = 0; tick < AI_MAX_TICKS; tick += 1) {
    if (state.status === "dead") {
      const x = Math.round(state.player.x);
      const deathCause = state.deathCause ?? "unknown";
      return {
        issues: [
          {
            code: "ai-died",
            deathCause,
            message: `Conservative AI died at x=${x} (${deathCause}).`,
            x,
          },
        ],
        ok: false,
      };
    }

    if (state.player.x >= level.finishX) {
      return { issues: [], ok: true };
    }

    const jumpPressed = decideAiInput(state, level.entities, level.rules);
    state = tickRun(
      state,
      { jumpPressed },
      AI_TICK_MS,
      level.rules,
      level.entities,
    );
  }

  const x = Math.round(state.player.x);
  return {
    issues: [
      {
        code: "finish-not-reached",
        message: `Conservative AI did not reach finish within ${AI_MAX_TICKS} ticks (stopped at x=${x}).`,
        x,
      },
    ],
    ok: false,
  };
}

export interface GenerateValidLevelResult {
  attempts: number;
  issues: readonly PlayabilityIssue[];
  level: LevelContent | null;
}

export function generateValidLevel(
  input: GeneratorInput,
  maxRetries: number,
): GenerateValidLevelResult {
  let lastIssues: readonly PlayabilityIssue[] = [];
  let seed = input.seed;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const level = generateLevel({ ...input, seed });
    const result = validateGeneratedPlayability(level);

    if (result.ok) {
      return { attempts: attempt, issues: [], level };
    }

    lastIssues = result.issues;
    seed = (seed + 1) | 0;
  }

  return { attempts: maxRetries, issues: lastIssues, level: null };
}
