import type { LevelEntity, RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const ORBITAL_LOOP_RULES: RunRules = firstWakeLevel.rules;

const REQUIRED_ORB_ID = "level-3-orb-1";

const ORBITAL_LOOP_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "orb",
    id: REQUIRED_ORB_ID,
    impulse: 720,
    height: 30,
    width: 30,
    x: 400,
    y: 280,
  },
  { type: "spike", height: 30, width: 30, x: 720, y: 270 },
];

const ORBITAL_LOOP_FINISH_X = 880;

function buildPlaceholderBeatMap(
  finishX: number,
  horizontalSpeed: number,
): LevelContent["beatMap"] {
  const traversalMs = Math.ceil((finishX / horizontalSpeed) * 1000);
  const durationMs = traversalMs + 600;
  const intervalMs = 600;
  const beats: number[] = [];

  for (let timeMs = 0; timeMs <= durationMs; timeMs += intervalMs) {
    beats.push(timeMs);
  }

  return { beats, durationMs };
}

export const orbitalLoopLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    ORBITAL_LOOP_FINISH_X,
    ORBITAL_LOOP_RULES.horizontalSpeed,
  ),
  entities: ORBITAL_LOOP_ENTITIES,
  expectedRoute: {
    requiredOrbIds: [REQUIRED_ORB_ID],
  },
  finishX: ORBITAL_LOOP_FINISH_X,
  rules: ORBITAL_LOOP_RULES,
};
