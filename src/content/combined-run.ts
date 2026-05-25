import type { LevelEntity, RunRules } from "../core/run-simulation";
import { buildPlaceholderBeatMap } from "./beat-maps";
import { firstWakeLevel, type LevelContent } from "./first-wake";

const COMBINED_RUN_RULES: RunRules = firstWakeLevel.rules;

const COMBINED_RUN_ENTITIES: readonly LevelEntity[] = [
  { type: "spike", height: 30, width: 30, x: 160, y: 270 },
  {
    type: "pad",
    id: "level-4-pad-1",
    impulse: 720,
    height: 18,
    width: 40,
    x: 380,
    y: 290,
  },
  { type: "portal", mode: "ship", height: 80, width: 12, x: 620, y: 220 },
  { type: "portal", mode: "cube", height: 80, width: 12, x: 870, y: 220 },
  { type: "spike", height: 30, width: 30, x: 950, y: 270 },
  {
    type: "pad",
    id: "level-4-pad-2",
    impulse: 720,
    height: 18,
    width: 40,
    x: 1140,
    y: 290,
  },
  { type: "spike", height: 30, width: 30, x: 1420, y: 270 },
];

const COMBINED_RUN_FINISH_X = 1580;

export const combinedRunLevel: LevelContent = {
  beatMap: buildPlaceholderBeatMap(
    COMBINED_RUN_FINISH_X,
    COMBINED_RUN_RULES.horizontalSpeed,
  ),
  entities: COMBINED_RUN_ENTITIES,
  finishX: COMBINED_RUN_FINISH_X,
  rules: COMBINED_RUN_RULES,
};
