import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const LAUNCH_SEQUENCE_RULES: RunRules = firstWakeLevel.rules;

export const launchSequenceLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_2",
    bpm: 120,
    sections: [
      { kind: "cube-tech", lengthBeats: 18, pulse: true },
      { kind: "air-orb", lengthBeats: 14 },
      { kind: "ship-cave", lengthBeats: 24, loft: true },
      { kind: "cube-tech", lengthBeats: 16 },
    ],
  }),
  rules: LAUNCH_SEQUENCE_RULES,
};
