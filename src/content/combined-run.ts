import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const COMBINED_RUN_RULES: RunRules = firstWakeLevel.rules;

export const combinedRunLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_4",
    bpm: 132,
    sections: [
      { kind: "cube-tech", lengthBeats: 10, pulse: true },
      { kind: "ship-open", lengthBeats: 12 },
      { kind: "air-orb", lengthBeats: 10, loft: true },
      { kind: "cube-pad", lengthBeats: 10 },
      { kind: "ship-cave", lengthBeats: 14, loft: true },
    ],
  }),
  rules: COMBINED_RUN_RULES,
};
