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
];

const SURGE_ENTITIES: readonly LevelEntity[] = [
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

const SKYLINE_RISE_ENTITIES: readonly LevelEntity[] = [
  { type: "block", shape: "ramp-up", height: 70, width: 110, x: 220, y: 230 },
  { type: "block", height: 70, width: 220, x: 330, y: 230 },
  { type: "spike", height: 30, width: 30, x: 420, y: 200 },
  { type: "block", shape: "ramp-down", height: 70, width: 110, x: 550, y: 230 },
];

const SKYLINE_DROP_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 190, y: 270 },
  { type: "block", height: 92, width: 100, x: 410, y: 208 },
  {
    type: "pad",
    id: "skyline-trial-pad",
    impulse: 760,
    height: 18,
    width: 45,
    x: 360,
    y: 282,
  },
  { type: "spike", height: 30, width: 30, x: 700, y: 270 },
];

const SKYLINE_FLIGHT_ENTITIES: readonly LevelEntity[] = [
  { type: "portal", mode: "ship", height: 300, width: 12, x: 240, y: 72 },
  { type: "portal", mode: "cube", height: 300, width: 12, x: 900, y: 72 },
  { type: "spike", height: 30, width: 30, x: 1100, y: 270 },
];

const VOID_RAMP_ENTITIES: readonly LevelEntity[] = [
  { type: "block", shape: "ramp-down", height: 80, width: 120, x: 180, y: 300 },
  { type: "block", height: 80, width: 220, x: 300, y: 300 },
  { type: "spike", height: 30, width: 30, x: 390, y: 270 },
  { type: "block", shape: "ramp-up", height: 80, width: 120, x: 520, y: 300 },
];

const VOID_ORB_ENTITIES: readonly LevelEntity[] = [
  {
    type: "orb",
    id: "void-circuit-orb",
    effect: { kind: "impulse", magnitude: 740 },
    height: 64,
    width: 56,
    x: 330,
    y: 160,
  },
  { type: "spike", height: 30, width: 30, x: 560, y: 270 },
  { type: "spike", height: 30, width: 30, x: 850, y: 270 },
];

const VOID_FLIGHT_ENTITIES: readonly LevelEntity[] = [
  { type: "portal", mode: "ship", height: 282, width: 12, x: 180, y: 82 },
  { type: "portal", mode: "cube", height: 282, width: 12, x: 1060, y: 82 },
  {
    type: "pad",
    id: "void-circuit-exit-pad",
    impulse: 760,
    height: 18,
    width: 48,
    x: 1160,
    y: 282,
  },
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
  "skyline-trial-1": buildStage(SKYLINE_RISE_ENTITIES, 860),
  "skyline-trial-2": buildStage(SKYLINE_DROP_ENTITIES, 960),
  "skyline-trial-3": buildStage(SKYLINE_FLIGHT_ENTITIES, 1240, [
    {
      startX: paceAuthoredX(210),
      endX: paceAuthoredX(940),
      ceilingEndX: paceAuthoredX(900) + 18,
      ceilingBottomY: 72,
      lowerSurfaceY: 372,
      gates: [
        { edge: "ceiling", limitY: 170, width: 60, x: paceAuthoredX(500) },
        { edge: "lower", limitY: 260, width: 60, x: paceAuthoredX(700) },
      ],
    },
  ]),
  "void-circuit-1": buildStage(VOID_RAMP_ENTITIES, 920),
  "void-circuit-2": buildStage(VOID_ORB_ENTITIES, 1120),
  "void-circuit-3": buildStage(VOID_FLIGHT_ENTITIES, 1400, [
    {
      startX: paceAuthoredX(150),
      endX: paceAuthoredX(1100),
      ceilingEndX: paceAuthoredX(1060) + 18,
      ceilingBottomY: 82,
      lowerSurfaceY: 364,
      gates: [
        { edge: "lower", limitY: 246, width: 70, x: paceAuthoredX(470) },
        { edge: "ceiling", limitY: 200, width: 70, x: paceAuthoredX(760) },
      ],
    },
  ]),
};

export function getGauntletStageContent(
  stageId: string,
): LevelContent | undefined {
  return STAGE_CONTENT[stageId];
}
