import {
  firstWakeLevel,
  type BeatMap,
  type LevelContent,
} from "../content/first-wake";
import type { LevelEntity } from "./run-simulation";
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

export interface BeatContext {
  beatMs: number;
  difficulty: OfficialLevelDifficulty;
  horizontalSpeed: number;
  intensity: Intensity;
  random: number;
}

export type PatternId = "spike" | "pad";

export type BeatSelection =
  | { type: "skip" }
  | { type: "pad"; x: number }
  | { type: "spike"; x: number };

interface PatternCapability {
  id: PatternId;
  minDifficulty: OfficialLevelDifficulty;
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
  { id: "spike", minDifficulty: "easy", requiresIntensity: "intense" },
  { id: "pad", minDifficulty: "hard", requiresIntensity: "intense" },
];

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

  if (patternId === "pad") {
    return { type: "pad", x };
  }

  return { type: "spike", x };
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

    if (selection.type === "spike") {
      entities.push({
        type: "spike",
        height: 30,
        width: 30,
        x: selection.x,
        y: 270,
      });
    } else if (selection.type === "pad") {
      entities.push({
        type: "pad",
        id: `generated-pad-${index}`,
        impulse: 720,
        height: 18,
        width: 40,
        x: selection.x,
        y: 290,
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
