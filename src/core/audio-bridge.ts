import type { AudioAnalysis } from "./audio-analyzer";
import type { GeneratorInput } from "./generator";
import type { OfficialLevelDifficulty } from "../content/official-levels";

export interface BridgeOptions {
  difficulty: OfficialLevelDifficulty;
  seed: number;
}

export function analysisToGeneratorInput(
  analysis: AudioAnalysis,
  options: BridgeOptions,
): GeneratorInput {
  return {
    beatIntensities: analysis.beats.map((beat) => beat.intensity),
    beatMap: {
      beats: analysis.beats.map((beat) => beat.ms),
      durationMs: analysis.durationMs,
    },
    difficulty: options.difficulty,
    seed: options.seed,
  };
}
