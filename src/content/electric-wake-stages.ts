import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

function buildAutoStage(finishX: number): LevelContent {
  return {
    beatMap: buildPlaceholderBeatMap(
      finishX,
      firstWakeLevel.rules.horizontalSpeed,
    ),
    entities: [],
    finishX,
    rules: firstWakeLevel.rules,
  };
}

const STAGE_CONTENT: Readonly<Record<string, LevelContent>> = {
  "electric-wake-1": buildAutoStage(220),
  "electric-wake-2": buildAutoStage(220),
  "electric-wake-3": buildAutoStage(220),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}
