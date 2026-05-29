import type { LevelContent } from "../content/first-wake";
import type { GeneratedLevelRecord } from "./profile";
import { generateLevel } from "./generator";
import {
  beatIntensitiesForTuning,
  beatMapForTuning,
  generatorInputFromRecord,
  type GeneratorTuning,
} from "./generator-tuning";
import type { LevelDemo } from "./level-solver";
import { recordConservativeDemo } from "./level-solver";

export interface GeneratedPlayableResult {
  demo: LevelDemo;
  level: LevelContent;
  seed: number;
}

export function buildGeneratedLevelRecord(
  index: number,
  tuning: GeneratorTuning,
): GeneratedLevelRecord {
  const seed = 1000 + index * 17 + tuning.length * 3;
  const beatMap = beatMapForTuning(tuning, seed);

  return {
    beatIntensities: beatIntensitiesForTuning(tuning, beatMap),
    beatMap,
    difficulty: tuning.difficulty,
    generatorTuning: tuning,
    id: `generated-level-${index}`,
    name: `Generated Level ${index}`,
    seed,
    subRank: tuning.subRank,
    source: "generator",
    theme: tuning.theme,
  };
}

export function generatePlayableTunedLevel(
  record: GeneratedLevelRecord,
  tuning: GeneratorTuning,
  maxRetries = 12,
): GeneratedPlayableResult {
  let seed = record.seed;

  for (let attempt = 0; attempt < maxRetries; attempt += 1) {
    const input = generatorInputFromRecord({ ...record, seed }, tuning);
    const level = generateLevel(input);
    const demo = recordConservativeDemo(level);

    if (demo.success) {
      return { demo, level, seed };
    }

    seed = (seed + 1) | 0;
  }

  const input = generatorInputFromRecord({ ...record, seed }, tuning);
  const level = generateLevel(input);
  return {
    demo: recordConservativeDemo(level),
    level,
    seed,
  };
}
