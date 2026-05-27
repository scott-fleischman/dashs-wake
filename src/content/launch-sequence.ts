import type { LevelEntity, RunRules } from "../core/run-simulation";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { withSupportingTerrain } from "./terrain";

const LAUNCH_SEQUENCE_RULES: RunRules = firstWakeLevel.rules;

const LAUNCH_SEQUENCE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 190, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 430,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 500, y: 270 },
  { type: "spike", height: 30, width: 30, x: 530, y: 270 },
  { type: "spike", height: 30, width: 30, x: 560, y: 270 },
  { type: "spike", height: 30, width: 30, x: 820, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-2",
    impulse: 720,
    height: 18,
    width: 40,
    x: 1070,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 1140, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1170, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1200, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1510, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-3",
    impulse: 720,
    height: 18,
    width: 40,
    x: 1780,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 1850, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1880, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1910, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2210, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-4",
    impulse: 720,
    height: 18,
    width: 40,
    x: 2450,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 2520, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2550, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2580, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2900, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-5",
    impulse: 720,
    height: 18,
    width: 40,
    x: 3180,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 3250, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3280, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3310, y: 270 },
];

const LAUNCH_SEQUENCE_FINISH_X = paceAuthoredX(3918);

export const launchSequenceLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_2"),
  entities: withSupportingTerrain(
    paceAuthoredEntities(LAUNCH_SEQUENCE_ENTITIES),
    LAUNCH_SEQUENCE_FINISH_X,
  ),
  finishX: LAUNCH_SEQUENCE_FINISH_X,
  rules: LAUNCH_SEQUENCE_RULES,
};
