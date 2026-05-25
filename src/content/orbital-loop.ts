import type { LevelEntity, RunRules } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const ORBITAL_LOOP_RULES: RunRules = firstWakeLevel.rules;

const REQUIRED_ORB_ID = "level-3-orb-1";

const ORBITAL_LOOP_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "orb",
    id: REQUIRED_ORB_ID,
    effect: { kind: "impulse", magnitude: 720 },
    height: 30,
    width: 30,
    x: 400,
    y: 280,
  },
  { type: "spike", height: 30, width: 30, x: 720, y: 270 },
  {
    type: "orb",
    id: "level-3-orb-2",
    effect: { kind: "impulse", magnitude: 720 },
    height: 30,
    width: 30,
    x: 940,
    y: 280,
  },
  { type: "spike", height: 30, width: 30, x: 1300, y: 270 },
];

const ORBITAL_LOOP_FINISH_X = 1460;

export const orbitalLoopLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    ORBITAL_LOOP_FINISH_X,
    ORBITAL_LOOP_RULES.horizontalSpeed,
  ),
  entities: ORBITAL_LOOP_ENTITIES,
  expectedRoute: {
    requiredTriggerIds: [REQUIRED_ORB_ID],
  },
  finishX: ORBITAL_LOOP_FINISH_X,
  rules: ORBITAL_LOOP_RULES,
};
