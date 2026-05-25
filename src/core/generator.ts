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

type RandomSource = () => number;

function mulberry32(seed: number): RandomSource {
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

export function generateLevel(input: GeneratorInput): LevelContent {
  const rng = mulberry32(input.seed);
  const rules = firstWakeLevel.rules;
  const entities: LevelEntity[] = [];

  for (const beatMs of input.beatMap.beats) {
    const placeRoll = rng();

    if (placeRoll >= PLACE_THRESHOLD) {
      continue;
    }

    const x = Math.round((beatMs / 1000) * rules.horizontalSpeed);

    if (x === 0) {
      continue;
    }

    entities.push({
      type: "spike",
      height: 30,
      width: 30,
      x,
      y: 270,
    });
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
