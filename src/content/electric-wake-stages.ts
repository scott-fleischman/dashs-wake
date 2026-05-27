import type { LevelEntity } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { withSupportingTerrain, type FlightChannel } from "./terrain";

function buildStage(
  entities: readonly LevelEntity[],
  finishX: number,
  channels: readonly FlightChannel[] = [],
): LevelContent {
  const pacedFinishX = paceAuthoredX(finishX);

  return {
    beatMap: buildPlaceholderBeatMap(
      pacedFinishX,
      firstWakeLevel.rules.horizontalSpeed,
    ),
    entities: withSupportingTerrain(
      paceAuthoredEntities(entities),
      pacedFinishX,
      channels,
    ),
    finishX: pacedFinishX,
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
  { type: "portal", mode: "ship", height: 374, width: 12, x: 560, y: 36 },
  { type: "portal", mode: "cube", height: 374, width: 12, x: 780, y: 36 },
  {
    type: "pad",
    id: "electric-wake-3-exit-pad",
    impulse: 720,
    height: 18,
    width: 100,
    x: 900,
    y: 320,
  },
  { type: "spike", height: 30, width: 30, x: 1040, y: 300 },
];

const STAGE_CONTENT: Readonly<Record<string, LevelContent>> = {
  "electric-wake-1": buildStage(SPARK_ENTITIES, 600),
  "electric-wake-2": buildStage(SURGE_ENTITIES, 600),
  "electric-wake-3": buildStage(CLIMAX_ENTITIES, 1180, [
    {
      startX: paceAuthoredX(530),
      endX: paceAuthoredX(1180),
      ceilingEndX: paceAuthoredX(780) + 18,
      lowerSurfaceY: 330,
    },
  ]),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}
