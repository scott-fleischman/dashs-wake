import type { LevelEntity, RunRules } from "../core/run-simulation";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const ORBITAL_LOOP_RULES: RunRules = firstWakeLevel.rules;

const REQUIRED_ORB_ID = "level-3-orb-1";

const ORBITAL_LOOP_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 175, y: 270 },
  {
    type: "orb",
    id: REQUIRED_ORB_ID,
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 213,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 205, y: 270 },
  { type: "spike", height: 30, width: 30, x: 235, y: 270 },
  { type: "spike", height: 30, width: 30, x: 265, y: 270 },
  { type: "spike", height: 30, width: 30, x: 760, y: 270 },
  {
    type: "orb",
    id: "level-3-orb-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 798,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 790, y: 270 },
  { type: "spike", height: 30, width: 30, x: 820, y: 270 },
  { type: "spike", height: 30, width: 30, x: 850, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1330, y: 270 },
  {
    type: "orb",
    id: "level-3-orb-3",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1368,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 1360, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1390, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1420, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1930, y: 270 },
  {
    type: "orb",
    id: "level-3-orb-4",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1945,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 1960, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1990, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2020, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2530, y: 270 },
  {
    type: "orb",
    id: "level-3-orb-5",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 2568,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 2560, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2590, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2620, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3200, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3540, y: 270 },
];

const ORBITAL_LOOP_FINISH_X = 5218;

export const orbitalLoopLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_3"),
  entities: paceAuthoredEntities(ORBITAL_LOOP_ENTITIES),
  expectedRoute: {
    requiredTriggerIds: [
      REQUIRED_ORB_ID,
      "level-3-orb-2",
      "level-3-orb-3",
      "level-3-orb-4",
      "level-3-orb-5",
    ],
  },
  finishX: paceAuthoredX(ORBITAL_LOOP_FINISH_X),
  rules: ORBITAL_LOOP_RULES,
};
