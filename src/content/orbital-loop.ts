import type { RunRules } from "../core/run-simulation";
import { firstWakeLevel, type LevelContent } from "./first-wake";
import { buildEpicLevel } from "./epic-course-builder";

const ORBITAL_LOOP_RULES: RunRules = firstWakeLevel.rules;

export const orbitalLoopLevel: LevelContent = {
  ...buildEpicLevel({
    id: "level_3",
    bpm: 108,
    sections: [
      { kind: "air-orb", lengthBeats: 18, pulse: true },
      { kind: "cube-tech", lengthBeats: 16 },
      { kind: "ship-cave", lengthBeats: 22 },
      { kind: "air-orb", lengthBeats: 16, loft: true },
    ],
  }),
  rules: ORBITAL_LOOP_RULES,
};
