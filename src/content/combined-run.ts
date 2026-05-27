import type { LevelEntity, RunRules } from "../core/run-simulation";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { withSupportingTerrain, type FlightChannel } from "./terrain";

const COMBINED_RUN_RULES: RunRules = firstWakeLevel.rules;

const COMBINED_RUN_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 175, y: 270 },
  {
    type: "pad",
    id: "level-4-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 395,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 470, y: 270 },
  { type: "spike", height: 30, width: 30, x: 500, y: 270 },
  { type: "spike", height: 30, width: 30, x: 530, y: 270 },
  { type: "portal", mode: "ship", height: 374, width: 12, x: 760, y: 36 },
  { type: "portal", mode: "cube", height: 374, width: 12, x: 1170, y: 36 },
  { type: "spike", height: 30, width: 30, x: 1510, y: 300 },
  {
    type: "orb",
    id: "level-4-orb-1",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1515,
    y: 205,
  },
  { type: "spike", height: 30, width: 30, x: 1540, y: 300 },
  { type: "spike", height: 30, width: 30, x: 1570, y: 300 },
  { type: "spike", height: 30, width: 30, x: 1600, y: 300 },
  {
    type: "pad",
    id: "level-4-pad-2",
    impulse: 720,
    height: 18,
    width: 40,
    x: 1910,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 1980, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2010, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2040, y: 270 },
  { type: "portal", mode: "ship", height: 374, width: 12, x: 2300, y: 36 },
  { type: "portal", mode: "cube", height: 374, width: 12, x: 2710, y: 36 },
  { type: "spike", height: 30, width: 30, x: 3070, y: 300 },
  {
    type: "orb",
    id: "level-4-orb-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 3075,
    y: 205,
  },
  { type: "spike", height: 30, width: 30, x: 3100, y: 300 },
  { type: "spike", height: 30, width: 30, x: 3130, y: 300 },
  { type: "spike", height: 30, width: 30, x: 3160, y: 300 },
  { type: "spike", height: 30, width: 30, x: 3540, y: 270 },
  {
    type: "pad",
    id: "level-4-pad-3",
    impulse: 720,
    height: 18,
    width: 40,
    x: 3740,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 3810, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3840, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3870, y: 270 },
];

const COMBINED_RUN_FINISH_X = paceAuthoredX(5225);
const COMBINED_FLIGHT_CHANNELS: readonly FlightChannel[] = [
  {
    startX: paceAuthoredX(730),
    endX: paceAuthoredX(1650),
    ceilingEndX: paceAuthoredX(1170) + 18,
    ceilingBottomY: 54,
    lowerSurfaceY: 330,
  },
  {
    startX: paceAuthoredX(2270),
    endX: paceAuthoredX(3240),
    ceilingEndX: paceAuthoredX(2710) + 18,
    ceilingBottomY: 54,
    lowerSurfaceY: 330,
  },
];

export const combinedRunLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_4"),
  entities: withSupportingTerrain(
    paceAuthoredEntities(COMBINED_RUN_ENTITIES),
    COMBINED_RUN_FINISH_X,
    COMBINED_FLIGHT_CHANNELS,
  ),
  expectedRoute: { requiredTriggerIds: ["level-4-orb-1", "level-4-orb-2"] },
  finishX: COMBINED_RUN_FINISH_X,
  rules: COMBINED_RUN_RULES,
};
