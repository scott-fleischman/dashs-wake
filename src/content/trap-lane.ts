import type { LevelEntity, RunRules } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const TRAP_LANE_RULES: RunRules = firstWakeLevel.rules;

const TRAP_LANE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "level-5-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 380,
    y: 290,
  },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 620, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 870, y: 220 },
  {
    type: "orb",
    id: "level-5-orb-safe",
    effect: { kind: "impulse", magnitude: 540 },
    height: 30,
    width: 30,
    x: 940,
    y: 280,
  },
  {
    type: "orb",
    id: "level-5-orb-trap",
    effect: { kind: "kill" },
    height: 30,
    width: 30,
    x: 1100,
    y: 280,
  },
  { type: "spike", height: 30, width: 30, x: 1300, y: 270 },
  {
    type: "orb",
    id: "level-5-orb-trap-2",
    effect: { kind: "kill" },
    height: 30,
    width: 30,
    x: 1480,
    y: 280,
  },
  { type: "spike", height: 30, width: 30, x: 1660, y: 270 },
];

const TRAP_LANE_FINISH_X = 1800;

export const trapLaneLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    TRAP_LANE_FINISH_X,
    TRAP_LANE_RULES.horizontalSpeed,
  ),
  entities: TRAP_LANE_ENTITIES,
  finishX: TRAP_LANE_FINISH_X,
  rules: TRAP_LANE_RULES,
};
