import type { LevelEntity, RunRules } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const LAUNCH_SEQUENCE_RULES: RunRules = firstWakeLevel.rules;

const LAUNCH_SEQUENCE_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 380,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 700, y: 270 },
  {
    type: "pad",
    id: "level-2-pad-2",
    impulse: 720,
    height: 18,
    width: 40,
    x: 920,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 1200, y: 270 },
];

const LAUNCH_SEQUENCE_FINISH_X = 1380;

export const launchSequenceLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    LAUNCH_SEQUENCE_FINISH_X,
    LAUNCH_SEQUENCE_RULES.horizontalSpeed,
  ),
  entities: LAUNCH_SEQUENCE_ENTITIES,
  finishX: LAUNCH_SEQUENCE_FINISH_X,
  rules: LAUNCH_SEQUENCE_RULES,
};
