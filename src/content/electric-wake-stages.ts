import type { LevelEntity } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

function buildStage(
  entities: readonly LevelEntity[],
  finishX: number,
): LevelContent {
  return {
    beatMap: buildPlaceholderBeatMap(
      finishX,
      firstWakeLevel.rules.horizontalSpeed,
    ),
    entities,
    finishX,
    rules: firstWakeLevel.rules,
  };
}

const SPARK_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  { type: "spike", height: 30, width: 30, x: 360, y: 270 },
];

const SURGE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "electric-wake-2-pad",
    impulse: 720,
    height: 18,
    width: 40,
    x: 340,
    y: 290,
  },
];

const CLIMAX_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "electric-wake-3-pad",
    impulse: 720,
    height: 18,
    width: 40,
    x: 320,
    y: 290,
  },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 560, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 780, y: 220 },
  { type: "spike", height: 30, width: 30, x: 860, y: 270 },
];

const STAGE_CONTENT: Readonly<Record<string, LevelContent>> = {
  "electric-wake-1": buildStage(SPARK_ENTITIES, 600),
  "electric-wake-2": buildStage(SURGE_ENTITIES, 600),
  "electric-wake-3": buildStage(CLIMAX_ENTITIES, 1020),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}
