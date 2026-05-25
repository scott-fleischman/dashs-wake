import {
  firstWakeLevel,
  type BeatMap,
  type LevelContent,
} from "../content/first-wake";
import type { LevelEntity } from "./run-simulation";
import type { OfficialLevelDifficulty } from "../content/official-levels";

export interface GeneratorInput {
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
  random: number;
}

export type BeatSelection = { type: "skip" } | { type: "spike"; x: number };

export function selectBeatPattern(context: BeatContext): BeatSelection {
  if (context.random >= PLACE_THRESHOLD) {
    return { type: "skip" };
  }

  const x = Math.round((context.beatMs / 1000) * context.horizontalSpeed);

  if (x === 0) {
    return { type: "skip" };
  }

  return { type: "spike", x };
}

export function generateLevel(input: GeneratorInput): LevelContent {
  const rng = mulberry32(input.seed);
  const rules = firstWakeLevel.rules;
  const entities: LevelEntity[] = [];

  for (const beatMs of input.beatMap.beats) {
    const selection = selectBeatPattern({
      beatMs,
      difficulty: input.difficulty,
      horizontalSpeed: rules.horizontalSpeed,
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
