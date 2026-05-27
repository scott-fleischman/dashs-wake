import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const COMBINED_RUN_RULES: RunRules = firstWakeLevel.rules;

export const combinedRunLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_4",
    bpm: 132,
    sections: [
      { kind: "cube-tech", lengthBeats: 12, pulse: true },
      { kind: "ship-cave", lengthBeats: 18 },
      { kind: "air-orb", lengthBeats: 12, loft: true },
      { kind: "ship-cave", lengthBeats: 20, pulse: true, loft: true },
      { kind: "cube-tech", lengthBeats: 12 },
    ],
  }),
  rules: COMBINED_RUN_RULES,
};
