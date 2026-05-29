import type { BeatMap } from "../content/first-wake";
import type { GeneratedLevelRecord } from "./profile";
import type { GeneratorInput, Intensity } from "./generator";
import { mulberry32 } from "./generator";

export type GeneratorTheme =
  | "cave"
  | "disco"
  | "electric"
  | "flash"
  | "forest"
  | "space"
  | "sunset"
  | "void";

export interface GeneratorTuning {
  difficulty: GeneratorInput["difficulty"];
  length: number;
  obstacleDensity: number;
  shipEmphasis: number;
  spikeEmphasis: number;
  subRank: NonNullable<GeneratedLevelRecord["subRank"]>;
  theme: GeneratorTheme;
  variety: number;
  verticalEmphasis: number;
}

export const DEFAULT_GENERATOR_TUNING: GeneratorTuning = {
  difficulty: "normal",
  length: 55,
  obstacleDensity: 50,
  shipEmphasis: 35,
  spikeEmphasis: 55,
  subRank: "bronze",
  theme: "electric",
  variety: 50,
  verticalEmphasis: 40,
};

function clampTuning(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeGeneratorTuning(
  partial: Partial<GeneratorTuning>,
): GeneratorTuning {
  return {
    difficulty: partial.difficulty ?? DEFAULT_GENERATOR_TUNING.difficulty,
    length: clampTuning(partial.length ?? DEFAULT_GENERATOR_TUNING.length),
    obstacleDensity: clampTuning(
      partial.obstacleDensity ?? DEFAULT_GENERATOR_TUNING.obstacleDensity,
    ),
    shipEmphasis: clampTuning(
      partial.shipEmphasis ?? DEFAULT_GENERATOR_TUNING.shipEmphasis,
    ),
    spikeEmphasis: clampTuning(
      partial.spikeEmphasis ?? DEFAULT_GENERATOR_TUNING.spikeEmphasis,
    ),
    subRank: partial.subRank ?? DEFAULT_GENERATOR_TUNING.subRank,
    theme: partial.theme ?? DEFAULT_GENERATOR_TUNING.theme,
    variety: clampTuning(partial.variety ?? DEFAULT_GENERATOR_TUNING.variety),
    verticalEmphasis: clampTuning(
      partial.verticalEmphasis ?? DEFAULT_GENERATOR_TUNING.verticalEmphasis,
    ),
  };
}

/** Maps generator theme to the in-run color palette. */
export function generatorThemeToLevelColor(
  theme: GeneratorTheme,
): import("./profile").LevelColorTheme {
  switch (theme) {
    case "forest":
      return "forest";
    case "sunset":
      return "sunset";
    case "void":
    case "cave":
    case "space":
      return "void";
    default:
      return "neon";
  }
}

export function beatMapForTuning(
  tuning: GeneratorTuning,
  seed: number,
): BeatMap {
  const durationMs = Math.round(12_000 + (tuning.length / 100) * 66_000);
  const beatIntervalMs = Math.round(460 - (tuning.obstacleDensity / 100) * 120);
  const rng = mulberry32(seed);
  const beats: number[] = [0];

  for (let timeMs = beatIntervalMs; timeMs <= durationMs; timeMs += beatIntervalMs) {
    const jitter = Math.round((rng() - 0.5) * (100 - tuning.variety) * 0.8);
    beats.push(Math.max(0, Math.min(durationMs, timeMs + jitter)));
  }

  if (beats[beats.length - 1] !== durationMs) {
    beats.push(durationMs);
  }

  return { beats, durationMs };
}

export function beatIntensitiesForTuning(
  tuning: GeneratorTuning,
  beatMap: BeatMap,
): readonly Intensity[] {
  const rng = mulberry32(tuning.length * 997 + tuning.variety * 131);
  return beatMap.beats.map((_, index) =>
    rng() + (index % 2 === 0 ? tuning.spikeEmphasis / 200 : 0) > 0.52
      ? "intense"
      : "quiet",
  );
}

export function generatorTuningFromRecord(
  record: GeneratedLevelRecord,
): GeneratorTuning {
  if (record.generatorTuning) {
    return normalizeGeneratorTuning(record.generatorTuning);
  }

  return normalizeGeneratorTuning({
    difficulty: record.difficulty,
    subRank: record.subRank,
    theme: record.theme,
  });
}

export function generatorInputFromRecord(
  record: GeneratedLevelRecord,
  tuning: GeneratorTuning,
): GeneratorInput & { tuning: GeneratorTuning } {
  const beatMap = record.beatMap.durationMs > 0
    ? record.beatMap
    : beatMapForTuning(tuning, record.seed);

  return {
    beatIntensities: record.beatIntensities.length
      ? record.beatIntensities
      : beatIntensitiesForTuning(tuning, beatMap),
    beatMap,
    difficulty: tuning.difficulty,
    seed: record.seed,
    subRank: tuning.subRank,
    theme: tuning.theme,
    tuning,
  };
}

