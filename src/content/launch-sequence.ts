import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const LAUNCH_SEQUENCE_RULES: RunRules = firstWakeLevel.rules;

export const launchSequenceLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_2",
    bpm: 120,
    sections: [
      { kind: "cube-intro", lengthBeats: 10 },
      { kind: "cube-pad", lengthBeats: 14, pulse: true },
      { kind: "ship-open", lengthBeats: 16 },
      { kind: "cube-pad", lengthBeats: 10 },
    ],
  }),
  rules: LAUNCH_SEQUENCE_RULES,
};
