import {
  firstWakeLevel,
  type BeatMap,
  type LevelContent,
} from "../content/first-wake";
import {
  applyAtomicPattern,
  type AtomicPatternId,
  type AtomicPatternOptions,
} from "../content/atomic-patterns";
import { CourseBuilder } from "../content/course-builder";
import { CUBE, PATTERN_BEAT_SPACING } from "../content/jump-grid";
import { withSupportingTerrain } from "../content/terrain";
import type { LevelEntity } from "./run-simulation";
import type { GeneratorTuning, GeneratorTheme } from "./generator-tuning";
import { simulateConservativeRun, SOLVER_MAX_TICKS } from "./level-solver";

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
  theme?: GeneratorTheme;
  seed: number;
  tuning?: GeneratorTuning;
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
const MIN_GAMEPLAY_PIECE_SPACING = PATTERN_BEAT_SPACING;

export interface BeatContext {
  beatMs: number;
  difficulty: GeneratorInput["difficulty"];
  horizontalSpeed: number;
  intensity: Intensity;
  random: number;
  subRank: NonNullable<GeneratorInput["subRank"]>;
  tuning?: GeneratorTuning;
}

export type PatternId = AtomicPatternId;

export type BeatSelection =
  | { type: "skip" }
  | { options?: AtomicPatternOptions; type: AtomicPatternId; x: number };

interface AtomicPatternCapability {
  id: AtomicPatternId;
  minDifficulty: GeneratorInput["difficulty"];
  options?: AtomicPatternOptions;
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

const ATOMIC_PATTERN_CAPABILITIES: readonly AtomicPatternCapability[] = [
  {
    id: "floor-run",
    minDifficulty: "easy",
    options: { cubesWide: 5 },
    requiresIntensity: "quiet",
  },
  {
    id: "floor-run",
    minDifficulty: "easy",
    options: { cubesWide: 4 },
    requiresIntensity: "intense",
  },
  {
    id: "fog",
    minDifficulty: "easy",
    requiresIntensity: "quiet",
  },
  {
    id: "flash",
    minDifficulty: "normal",
    requiresIntensity: "intense",
  },
  {
    id: "spike-strip",
    minDifficulty: "normal",
    options: { count: 2 },
    requiresIntensity: "intense",
  },
  {
    id: "stair-step",
    minDifficulty: "normal",
    options: { steps: 2 },
    requiresIntensity: "intense",
  },
  {
    id: "stair-gap",
    minDifficulty: "hard",
    options: { steps: 2 },
    requiresIntensity: "intense",
  },
  {
    id: "stair-spike-edge",
    minDifficulty: "harder",
    options: { steps: 2 },
    requiresIntensity: "intense",
  },
  {
    id: "pad-boost",
    minDifficulty: "hard",
    requiresIntensity: "intense",
  },
  {
    id: "pad-chain",
    minDifficulty: "hard",
    options: { count: 3 },
    requiresIntensity: "intense",
  },
  {
    id: "jump-orb",
    minDifficulty: "harder",
    requiresIntensity: "intense",
  },
  {
    id: "orb-stack",
    minDifficulty: "insane",
    options: { count: 3, required: true },
    requiresIntensity: "intense",
  },
  {
    id: "fake-pad",
    minDifficulty: "demon",
    requiresIntensity: "intense",
  },
];

function capabilityPool(
  intensity: Intensity,
  difficulty: GeneratorInput["difficulty"],
): readonly AtomicPatternCapability[] {
  const rank = DIFFICULTY_RANK[difficulty];
  return ATOMIC_PATTERN_CAPABILITIES.filter(
    (capability) =>
      capability.requiresIntensity === intensity &&
      DIFFICULTY_RANK[capability.minDifficulty] <= rank,
  );
}

const SUBRANK_MULTIPLIER = {
  bronze: 0.85,
  gold: 1,
  diamond: 1.15,
  void: 1.3,
} as const;

function effectivePlaceThreshold(
  subRank: NonNullable<GeneratorInput["subRank"]>,
  tuning?: GeneratorTuning,
): number {
  const base = Math.min(0.75, BASE_PLACE_THRESHOLD * SUBRANK_MULTIPLIER[subRank]);
  if (!tuning) {
    return base;
  }

  const densityLift = (100 - tuning.obstacleDensity) / 100;
  return Math.min(0.82, base * (0.55 + densityLift * 0.7));
}

function patternWeight(patternId: AtomicPatternId, tuning: GeneratorTuning): number {
  switch (patternId) {
    case "stair-gap":
    case "stair-step":
    case "stair-spike-edge":
      return 0.3 + tuning.verticalEmphasis / 85;
    case "pad-chain":
    case "pad-boost":
      return 0.35 + tuning.verticalEmphasis / 200;
    case "jump-orb":
    case "orb-stack":
      return 0.35 + tuning.spikeEmphasis / 200;
    case "spike-strip":
    case "fake-pad":
      return 0.4 + tuning.spikeEmphasis / 90;
    default:
      return 0.45;
  }
}

function pickWeightedPattern(
  permitted: readonly AtomicPatternCapability[],
  tuning: GeneratorTuning,
  random: number,
): AtomicPatternCapability {
  const weights = permitted.map((capability) =>
    patternWeight(capability.id, tuning),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random * total;

  for (let index = 0; index < permitted.length; index += 1) {
    cursor -= weights[index]!;
    if (cursor <= 0) {
      return permitted[index]!;
    }
  }

  return permitted[permitted.length - 1]!;
}

function effectiveMinSpacing(subRank: NonNullable<GeneratorInput["subRank"]>): number {
  const ratio = 1.2 - (SUBRANK_MULTIPLIER[subRank] - 0.85);
  return Math.max(140, Math.round(MIN_GAMEPLAY_PIECE_SPACING * ratio));
}

export function permittedPatterns(
  intensity: Intensity,
  difficulty: GeneratorInput["difficulty"],
): readonly PatternId[] {
  return capabilityPool(intensity, difficulty).map((capability) => capability.id);
}

export function selectBeatPattern(context: BeatContext): BeatSelection {
  const permitted = capabilityPool(context.intensity, context.difficulty);

  if (permitted.length === 0) {
    return { type: "skip" };
  }

  if (
    context.random >=
    effectivePlaceThreshold(context.subRank, context.tuning)
  ) {
    return { type: "skip" };
  }

  const x = Math.round((context.beatMs / 1000) * context.horizontalSpeed);

  if (x === 0) {
    return { type: "skip" };
  }

  const capability = context.tuning
    ? pickWeightedPattern(
        permitted,
        context.tuning,
        (context.random * 3.7) % 1,
      )
    : permitted[
        Math.min(
          permitted.length - 1,
          Math.floor(
            context.random /
              (effectivePlaceThreshold(context.subRank) / permitted.length),
          ),
        )
      ]!;

  return { type: capability.id, options: capability.options, x };
}

function themeAmbienceEntities(
  theme: GeneratorTheme,
  finishX: number,
  rng: () => number,
): LevelEntity[] {
  const decorations: LevelEntity[] = [];
  const zoneWidth = Math.max(280, Math.floor(finishX / 4));

  const pushZone = (
    kind: "beam" | "dark" | "diamond" | "flash" | "fog",
    index: number,
  ): void => {
    decorations.push({
      type: "decoration",
      kind,
      height: kind === "dark" ? 140 : 88,
      width: zoneWidth,
      x: 120 + index * (zoneWidth + 80),
      y: kind === "dark" ? 0 : 70 + Math.round(rng() * 40),
    });
  };

  switch (theme) {
    case "cave":
      for (let index = 0; index < 3; index += 1) {
        pushZone(index % 2 === 0 ? "fog" : "dark", index);
      }
      break;
    case "space":
      for (let index = 0; index < 3; index += 1) {
        pushZone(index % 2 === 0 ? "dark" : "diamond", index);
      }
      break;
    case "disco":
    case "flash":
      for (let index = 0; index < 4; index += 1) {
        pushZone(index % 2 === 0 ? "flash" : "beam", index);
      }
      break;
    case "void":
      for (let index = 0; index < 2; index += 1) {
        pushZone("dark", index);
      }
      break;
  }

  return decorations.filter((entity) => entity.x + entity.width < finishX);
}

export function generateLevel(input: GeneratorInput): LevelContent {
  const rng = mulberry32(input.seed);
  const subRank = input.subRank ?? "bronze";
  const rules = firstWakeLevel.rules;
  const finishX = Math.round((input.beatMap.durationMs / 1000) * rules.horizontalSpeed);
  const minSpacing = effectiveMinSpacing(subRank);
  const builder = new CourseBuilder({
    idPrefix: `generated-${input.seed}`,
    startX: 0,
  });
  let lastPatternX = 0;

  applyAtomicPattern(builder, "floor-run", { cubesWide: 6 });

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
      tuning: input.tuning,
    });

    if (selection.type === "skip") {
      continue;
    }

    if (Math.abs(selection.x - lastPatternX) < minSpacing) {
      continue;
    }

    if (selection.x > builder.x) {
      applyAtomicPattern(builder, "floor-run", {
        cubesWide: Math.max(6, Math.round((selection.x - builder.x) / CUBE)),
      });
    }
    if (builder.x < selection.x) {
      builder.x = selection.x;
    }

    applyAtomicPattern(builder, selection.type, selection.options ?? {});
    lastPatternX = builder.x;
  }

  while (builder.x < finishX - 340) {
    applyAtomicPattern(builder, "floor-run", { cubesWide: 5 });
  }

  const hasVerticalGameplay = builder.entities.some(
    (entity) => entity.type === "block" && entity.y < rules.spawnY - 24,
  );
  if (
    DIFFICULTY_RANK[input.difficulty] >= DIFFICULTY_RANK.normal &&
    !hasVerticalGameplay
  ) {
    applyAtomicPattern(builder, "stair-step", { steps: 2 });
  }

  const theme = input.tuning?.theme ?? input.theme ?? "electric";
  const ambience = themeAmbienceEntities(theme, finishX, rng);
  const withinBounds = (entity: LevelEntity): boolean =>
    entity.x >= 0 && entity.x + entity.width <= finishX;

  return {
    beatMap: input.beatMap,
    entities: [
      ...withSupportingTerrain(builder.entities, finishX, builder.channels),
      ...ambience.filter(withinBounds),
    ],
    finishX,
    rules,
  };
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
  // Difficulty is driven by what actually threatens the runner — spikes, orbs,
  // and pads — not by structural/terrain blocks (ground steps, ship-corridor
  // floors and ceilings, walkable ramps). Counting terrain saturates the score,
  // which is why a calm staircase used to read as "nightmare".
  const hazardCount = level.entities.filter(
    (entity) =>
      entity.type === "spike" ||
      entity.type === "orb" ||
      entity.type === "pad",
  ).length;
  const obstacleDensityPer1000 = hazardCount / Math.max(1, level.finishX / 1000);
  // Precision pressure comes from how tightly spikes are packed — that is the
  // reaction window the player must hit. Terrain spacing is irrelevant here.
  const sortedSpikes = level.entities
    .filter((entity) => entity.type === "spike")
    .slice()
    .sort((a, b) => a.x - b.x);
  let tightestGap = Number.POSITIVE_INFINITY;
  for (let i = 1; i < sortedSpikes.length; i += 1) {
    tightestGap = Math.min(tightestGap, sortedSpikes[i]!.x - sortedSpikes[i - 1]!.x);
  }
  const peakPrecisionFrames =
    Number.isFinite(tightestGap) && tightestGap > 0
      ? Math.max(1, Math.round((tightestGap / level.rules.horizontalSpeed) * 60))
      : 45;
  // Distance-based ship ratio: how much of the run is spent threading a
  // corridor, measured from each ship portal to its following cube exit.
  const shipPortals = level.entities
    .filter((entity) => entity.type === "portal" && entity.mode === "ship")
    .slice()
    .sort((a, b) => a.x - b.x);
  let shipSpan = 0;
  for (const portal of shipPortals) {
    const exit = level.entities.find(
      (entity) =>
        entity.type === "portal" && entity.mode === "cube" && entity.x > portal.x,
    );
    if (exit) {
      shipSpan += exit.x - portal.x;
    }
  }
  const shipSectionRatio = Math.min(1, shipSpan / Math.max(1, level.finishX));
  const estimatedDifficulty = Math.max(
    0,
    Math.min(
      100,
      obstacleDensityPer1000 * 11 +
        (24 / peakPrecisionFrames) * 9 +
        shipSectionRatio * 40,
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
  const result = simulateConservativeRun(level);

  if (!result.reachedFinish && result.deathCause) {
    return {
      issues: [
        {
          code: "ai-died",
          deathCause: result.deathCause,
          message: `Conservative AI died at x=${result.stoppedX} (${result.deathCause}).`,
          x: result.stoppedX,
        },
      ],
      ok: false,
    };
  }

  if (result.reachedFinish) {
    return { issues: [], ok: true };
  }

  return {
    issues: [
      {
        code: "finish-not-reached",
        message: `Conservative AI did not reach finish within ${SOLVER_MAX_TICKS} ticks (stopped at x=${result.stoppedX}).`,
        x: result.stoppedX,
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
