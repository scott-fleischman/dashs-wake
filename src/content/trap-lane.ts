import type { LevelEntity, RunRules } from "../core/run-simulation";
import { paceAuthoredEntities, paceAuthoredX } from "./level-pace";
import { buildOfficialBeatMap } from "./official-soundtrack";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const TRAP_LANE_RULES: RunRules = firstWakeLevel.rules;

const TRAP_LANE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 180, y: 270 },
  {
    type: "pad",
    id: "level-5-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 405,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 480, y: 270 },
  { type: "spike", height: 30, width: 30, x: 510, y: 270 },
  { type: "spike", height: 30, width: 30, x: 540, y: 270 },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 770, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 1180, y: 220 },
  { type: "spike", height: 30, width: 30, x: 1350, y: 270 },
  {
    type: "orb",
    id: "level-5-orb-safe",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1355,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 1400, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1430, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1460, y: 270 },
  { type: "spike", height: 30, width: 30, x: 1980, y: 270 },
  {
    type: "orb",
    id: "level-5-orb-trap",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 1980,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 2025, y: 104 },
  { type: "spike", height: 30, width: 30, x: 2055, y: 104 },
  { type: "spike", height: 30, width: 30, x: 2460, y: 270 },
  {
    type: "pad",
    id: "level-5-pad-2",
    impulse: 720,
    height: 18,
    width: 40,
    x: 2680,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 2750, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2780, y: 270 },
  { type: "spike", height: 30, width: 30, x: 2810, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3160, y: 270 },
  {
    type: "orb",
    id: "level-5-orb-trap-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 3160,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 3205, y: 104 },
  { type: "spike", height: 30, width: 30, x: 3235, y: 104 },
  { type: "spike", height: 30, width: 30, x: 3640, y: 270 },
  {
    type: "orb",
    id: "level-5-orb-safe-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 90,
    width: 72,
    x: 3645,
    y: 175,
  },
  { type: "spike", height: 30, width: 30, x: 3670, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3700, y: 270 },
  { type: "spike", height: 30, width: 30, x: 3730, y: 270 },
  { type: "spike", height: 30, width: 30, x: 4260, y: 270 },
  {
    type: "pad",
    id: "level-5-pad-3",
    impulse: 720,
    height: 18,
    width: 40,
    x: 4480,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 4550, y: 270 },
  { type: "spike", height: 30, width: 30, x: 4580, y: 270 },
  { type: "spike", height: 30, width: 30, x: 4610, y: 270 },
];

const TRAP_LANE_FINISH_X = 5218;

export const trapLaneLevel: LevelContent = {
  beatMap: buildOfficialBeatMap("level_5"),
  entities: paceAuthoredEntities(TRAP_LANE_ENTITIES),
  finishX: paceAuthoredX(TRAP_LANE_FINISH_X),
  rules: TRAP_LANE_RULES,
};
