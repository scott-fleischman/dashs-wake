import type { LevelEntity, RunRules } from "../core/run-simulation";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";

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
  { type: "portal", mode: "ship", height: 80, width: 12, x: 760, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 1170, y: 220 },
  { type: "spike", height: 30, width: 30, x: 1350, y: 270 },
  {
    type: "orb",
    id: "level-4-orb-1",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1355,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 1380, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1410, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1440, y: 270 },
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
  { type: "portal", mode: "ship", height: 80, width: 12, x: 2300, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 2710, y: 220 },
  { type: "spike", height: 30, width: 30, x: 2910, y: 270 },
  {
    type: "orb",
    id: "level-4-orb-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 2915,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 2940, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2970, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3000, y: 270 },
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

const COMBINED_RUN_FINISH_X = 5225;

export const combinedRunLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_4"),
  entities: paceAuthoredEntities(COMBINED_RUN_ENTITIES),
  expectedRoute: { requiredTriggerIds: ["level-4-orb-1", "level-4-orb-2"] },
  finishX: paceAuthoredX(COMBINED_RUN_FINISH_X),
  rules: COMBINED_RUN_RULES,
};
