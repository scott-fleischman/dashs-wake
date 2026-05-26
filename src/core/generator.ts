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
import type { OfficialLevelDifficulty } from "../content/official-levels";

export type Intensity = "intense" | "quiet";

export interface GeneratorInput {
  beatIntensities?: readonly Intensity[];
  beatMap: BeatMap;
  difficulty: OfficialLevelDifficulty;
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

const PLACE_THRESHOLD = 0.4;
const FINISH_TAIL = 200;
const MIN_GAMEPLAY_PIECE_SPACING = 220;

export interface BeatContext {
  beatMs: number;
  difficulty: OfficialLevelDifficulty;
  horizontalSpeed: number;
  intensity: Intensity;
  random: number;
}

export type PatternId = "block" | "orb" | "pad" | "spike";

export type BeatSelection =
  | { type: "skip" }
  | { type: "block"; x: number }
  | { type: "orb"; x: number }
  | { type: "pad"; x: number }
  | { type: "spike"; x: number };

interface PatternProduceArgs {
  beatIndex: number;
  x: number;
}

interface PatternCapability {
  id: PatternId;
  minDifficulty: OfficialLevelDifficulty;
  produce: (args: PatternProduceArgs) => LevelEntity;
  requiresIntensity: Intensity;
}

const DIFFICULTY_RANK: Record<OfficialLevelDifficulty, number> = {
  easy: 0,
  normal: 1,
  hard: 2,
  harder: 3,
  insane: 4,
};

const PATTERN_CAPABILITIES: readonly PatternCapability[] = [
  {
    id: "spike",
    minDifficulty: "easy",
    requiresIntensity: "intense",
    produce: ({ x }) => ({ type: "spike", height: 30, width: 30, x, y: 270 }),
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
];

function findCapability(id: PatternId): PatternCapability | undefined {
  return PATTERN_CAPABILITIES.find((capability) => capability.id === id);
}

function hasGameplaySpacing(
  candidateX: number,
  entities: readonly LevelEntity[],
): boolean {
  return entities.every(
    (entity) =>
      entity.type === "decoration" ||
      Math.abs(entity.x - candidateX) >= MIN_GAMEPLAY_PIECE_SPACING,
  );
}

export function permittedPatterns(
  intensity: Intensity,
  difficulty: OfficialLevelDifficulty,
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

  if (context.random >= PLACE_THRESHOLD) {
    return { type: "skip" };
  }

  const x = Math.round((context.beatMs / 1000) * context.horizontalSpeed);

  if (x === 0) {
    return { type: "skip" };
  }

  const slotWidth = PLACE_THRESHOLD / permitted.length;
  const idx = Math.min(
    permitted.length - 1,
    Math.floor(context.random / slotWidth),
  );
  const patternId = permitted[idx]!;

  return { type: patternId, x };
}

export function generateLevel(input: GeneratorInput): LevelContent {
  const rng = mulberry32(input.seed);
  const rules = firstWakeLevel.rules;
  const entities: LevelEntity[] = [];

  for (let index = 0; index < input.beatMap.beats.length; index += 1) {
    const beatMs = input.beatMap.beats[index]!;
    const intensity = input.beatIntensities?.[index] ?? "intense";
    const selection = selectBeatPattern({
      beatMs,
      difficulty: input.difficulty,
      horizontalSpeed: rules.horizontalSpeed,
      intensity,
      random: rng(),
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
      if (hasGameplaySpacing(candidate.x, entities)) {
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
      .find((x) => hasGameplaySpacing(x, entities));
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

  const finishX =
    Math.round((input.beatMap.durationMs / 1000) * rules.horizontalSpeed) +
    FINISH_TAIL;

  return {
    beatMap: input.beatMap,
    entities,
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
    return false;
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
